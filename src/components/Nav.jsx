// src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";

import {
  BiHomeAlt2,
  BiSearch,
  BiHeart,
  BiPlusCircle,
  BiMenu
} from 'react-icons/bi';
import { MdOutlineExplore } from 'react-icons/md';
import { FiMapPin } from "react-icons/fi";

// Heroicons for Updates
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { MegaphoneIcon as MegaphoneIconSolid } from "@heroicons/react/24/solid";

// Import your Post modal
import PostCreatorModal from "./PostCreatorModal";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, firestoreUser, loading } = useAuth();
  const [showMore, setShowMore] = useState(false);

  // 🔹 Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔹 Example notifications placeholder
  const [notifications] = useState(3);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return null;

  const profileImage =
    user?.photoURL || firestoreUser?.profileImage || "/default-profile.png";

  return (
    <>
      <nav className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-gray-300 flex flex-col py-6 px-3 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <Link to="/" className="mb-8 pl-2">
          <h1 className="text-2xl font-bold cursor-pointer">City Pulse</h1>
        </Link>

        {/* Navigation Items */}
        <div className="flex flex-col flex-grow space-y-1 relative pb-6">
          <NavItem
            to="/"
            icon={<BiHomeAlt2 size={24} />}
            text="Home"
            active={location.pathname === '/'}
          />
          <NavItem
            to="/search"
            icon={<BiSearch size={24} />}
            text="Search"
            active={location.pathname === '/search'}
          />
          <NavItem
            to="/explore"
            icon={<MdOutlineExplore size={24} />}
            text="Explore"
            active={location.pathname === '/explore'}
          />

          {/* Create Post Button */}
          {user && (
            <NavButton
              onClick={() => setIsModalOpen(true)}
              icon={<BiPlusCircle size={24} />}
              text="Create Post"
            />
          )}

          {/* Other nav items */}
          <div className="pt-2">
            <NavItem
              to="/map"
              icon={<FiMapPin size={24} />}
              text="Map"
              active={location.pathname === '/map'}
            />

            {/* ✅ New Updates button with badge */}
            <Link
              to="/updates"
              className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors relative ${
                location.pathname.startsWith("/updates") ? "font-bold bg-gray-100" : ""
              }`}
            >
              <span className="mr-4 relative">
                {location.pathname.startsWith("/updates") ? (
                  <MegaphoneIconSolid className="w-6 h-6" />
                ) : (
                  <MegaphoneIcon className="w-6 h-6" />
                )}

                {notifications > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </span>
              <span>Updates</span>
            </Link>

            <NavItem
              to="/about"
              icon={<BiHeart size={24} />}
              text="Notifications"
              active={location.pathname === '/about'}
            />
          </div>

          {/* Auth dependent */}
          {user ? (
            <div className="mt-auto">
              <NavItem
                to="/profile"
                icon={
                  <img
                    src={profileImage}
                    alt={user?.displayName ?? "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                }
                text="Profile"
                active={location.pathname === '/profile'}
              />
              <button
                onClick={handleLogout}
                className="w-full mt-2 text-sm text-red-500 hover:text-red-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-auto space-y-2">
              <Link
                to="/login"
                className="block w-full text-center py-2 px-4 text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block w-full text-center py-2 px-4 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* More Menu */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${
              showMore ? "bg-gray-100" : ""
            }`}
          >
            <BiMenu size={24} className="mr-4" />
            <span>More</span>
          </button>

          {showMore && (
            <div className="ml-2 space-y-1">
              <NavItem
                to="/about"
                text="About"
                active={location.pathname === '/about'}
              />
              <NavItem
                to="/contact"
                text="Contact"
                active={location.pathname === '/contact'}
              />
            </div>
          )}
        </div>
      </nav>

      {/* 🔹 Mount PostCreatorModal */}
      <PostCreatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

// nav components
const NavItem = ({ to, icon, text, active }) => (
  <Link
    to={to}
    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${
      active ? "font-bold bg-gray-100" : ""
    }`}
  >
    <span className="mr-4">{icon}</span>
    <span>{text}</span>
  </Link>
);

const NavButton = ({ onClick, icon, text }) => (
  <button
    onClick={onClick}
    className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
  >
    <span className="mr-4">{icon}</span>
    <span>{text}</span>
  </button>
);

export default Navbar;