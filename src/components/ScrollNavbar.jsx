// src/components/ScrollNavbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  MapIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import {
  UserIcon as UserIconSolid,
  MapIcon as MapIconSolid,
  MegaphoneIcon as MegaphoneIconSolid,
} from "@heroicons/react/24/solid";

const ScrollNavbar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [notifications, setNotifications] = useState(2);
  const [username, setUsername] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 697);

  const navigate = useNavigate();
  const location = useLocation();

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // ✅ Responsive resize check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 697);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Listen for user data if on profile
  useEffect(() => {
    if (uid && location.pathname.startsWith("/profile")) {
      const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
        if (snap.exists()) {
          setUsername(snap.data().username || "");
        }
      });
      return () => unsub();
    }
  }, [uid, location.pathname]);

  // ✅ Scroll visibility and progress
  useEffect(() => {
    const handleScroll = () => {
      const firstSection = document.getElementById("first-section");
      if (firstSection) {
        const bottom = firstSection.offsetTop + firstSection.offsetHeight;
        setIsVisible(window.scrollY > bottom);
      } else {
        setIsVisible(true);
      }

      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { path: "/map", icon: MapIcon, iconSolid: MapIconSolid, label: "Map" },
    { path: "/profile", icon: UserIcon, iconSolid: UserIconSolid, label: "Profile" },
  ];
  const isActive = (path) => location.pathname.startsWith(path);

  // 🎨 Blue accent from bottom nav
  const blue = "oklch(62.3%_0.214_259.815)";

  return (
    <nav
      className={`fixed top-3 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-out
      ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
    >
      <div className="w-full max-w-md mx-auto mt-3 px-3">
        {/* Scroll progress bar */}
        <div className="absolute -top-3 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: blue,
              width: `${scrollProgress}%`,
            }}
          />
        </div>

        {/* Main nav container */}
        <div
          className="relative flex items-center justify-between h-16
          bg-white/90 border border-gray-200 rounded-2xl shadow-lg
          backdrop-blur-md px-4"
        >
          {/* LEFT NAV */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = isActive(item.path) ? item.iconSolid : item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative group px-3 py-2 rounded-xl transition-all duration-200 text-sm
                    ${
                      isActive(item.path)
                        ? `bg-[${blue}]/10 text-[${blue}] font-semibold`
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:block">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER LOGO */}
          <div className="relative group cursor-pointer" onClick={() => navigate("/")}>
            <div
              className="absolute inset-0 rounded-lg blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"
              style={{
                background: `linear-gradient(90deg, ${blue}, ${blue} / 0.7)`,
              }}
            />
            <h1
              className="relative font-serif text-xl sm:text-2xl tracking-wider font-bold transform group-hover:scale-105 transition-transform duration-200"
              style={{
                color: blue,
                fontFamily: "'Cinzel','Times New Roman',serif",
              }}
            >
              CIVIC
            </h1>
          </div>

          {/* RIGHT NAV */}
          <div className="flex items-center gap-2">
            {location.pathname.startsWith("/profile") && username && (
              <span className="hidden sm:block font-semibold text-gray-800 mr-2">
                @{username}
              </span>
            )}

            {/* Updates */}
            <button
              onClick={() => navigate("/updates")}
              className={`relative group px-3 py-2 rounded-xl transition-all duration-200 text-sm
                ${
                  isActive("/updates")
                    ? `bg-[${blue}]/10 text-[${blue}] font-semibold`
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
            >
              <div className="flex items-center gap-2">
                {isActive("/updates") ? (
                  <MegaphoneIconSolid className="w-5 h-5" />
                ) : (
                  <MegaphoneIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:block">Updates</span>
              </div>
              {notifications > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center animate-pulse text-white text-xs font-bold"
                  style={{
                    background: `linear-gradient(90deg, ${blue}, ${blue} / 0.8)`,
                  }}
                >
                  {notifications}
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300 mx-2" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`group relative px-4 py-2 rounded-xl overflow-hidden border border-[${blue}]`}
            >
              <div className="relative flex items-center gap-2 z-10">
                <ArrowRightOnRectangleIcon
                  className="w-5 h-5 text-[oklch(62.3%_0.214_259.815)] group-hover:text-white transition-colors duration-300"
                />
                <span
                  className="hidden sm:block font-medium transition-colors duration-300"
                  style={{
                    color: `oklch(62.3%_0.214_259.815)`,
                  }}
                >
                  Logout
                </span>
              </div>
              <div
                className="absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left opacity-0 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, ${blue}, ${blue} / 0.8)`,
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ScrollNavbar;