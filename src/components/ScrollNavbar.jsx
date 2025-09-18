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
  const [notifications, setNotifications] = useState(3);
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

  // ✅ Navbar visibility logic
  useEffect(() => {
    const handleScroll = () => {
      const firstSection = document.getElementById("first-section");

      if (firstSection) {
        const firstSectionBottom =
          firstSection.offsetTop + firstSection.offsetHeight;
        setIsVisible(window.scrollY > firstSectionBottom);
      } else {
        setIsVisible(true); // always on other pages
      }

      // Scroll progress
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { path: "/map", icon: MapIcon, iconSolid: MapIconSolid, label: "Map" },
    { path: "/profile", icon: UserIcon, iconSolid: UserIconSolid, label: "Profile" },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out
          ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        {/* Scroll progress bar */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="h-full  transition-all duration-300"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* LEFT NAV */}
              <div className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = isActive(item.path) ? item.iconSolid : item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`relative group px-3 py-2 rounded-xl transition-all duration-200
                        ${
                          isActive(item.path)
                            ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600"
                            : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        }`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="hidden sm:block text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CENTER LOGO */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 
                    rounded-lg blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  <h1 className="relative text-2xl font-black tracking-wider bg-blue-700
                     bg-clip-text text-transparent
                    transform group-hover:scale-105 transition-transform duration-200">
                    CIVIC
                  </h1>
                </div>
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
                  className={`relative group px-3 py-2 rounded-xl transition-all duration-200
                    ${
                      isActive("/updates")
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600"
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                  title="Updates"
                >
                  <div className="flex items-center gap-2">
                    {isActive("/updates") ? (
                      <MegaphoneIconSolid className="w-5 h-5" />
                    ) : (
                      <MegaphoneIcon className="w-5 h-5" />
                    )}
                    <span className="hidden sm:block text-sm font-medium">
                      Updates
                    </span>
                  </div>
                  {notifications > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 
                        rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-xs font-bold">{notifications}</span>
                    </div>
                  )}
                </button>

                <div className="h-8 w-px bg-gray-300 mx-2" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="group relative px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 
                    hover:from-red-500 hover:to-pink-500 transition-all duration-300 overflow-hidden"
                  title="Logout"
                >
                  <div className="relative flex items-center gap-2">
                    <ArrowRightOnRectangleIcon
                      className="w-5 h-5 text-red-500 group-hover:text-white transition-colors duration-300"
                    />
                    <span className="hidden sm:block text-sm font-medium text-red-500 group-hover:text-white transition-colors duration-300">
                      Logout
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 
                    transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 
                    origin-left opacity-0 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent" />
      </nav>

      {/* ⬆ Scroll-to-top button with dynamic positioning */}
      {isVisible && (
        <div
          className={`fixed right-6 z-40 ${
            isMobile ? "bottom-24" : "bottom-8"
          }`} // ✅ lifted higher on mobile
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 
              rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 
              transition-all duration-300"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 
              animate-ping opacity-20"
            />
          </button>
        </div>
      )}
    </>
  );
};

export default ScrollNavbar;