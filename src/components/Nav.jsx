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
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapIconSolid } from "@heroicons/react/24/solid";

import PostCreatorModal from "./PostCreatorModal";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, firestoreUser, loading } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return null;

  const profileImage =
    user?.photoURL || firestoreUser?.profileImage || "/default-profile.png";

  const handleNavClick = () => {
    setHovered(false); // collapse on selecting any tab
  };

  return (
    <>
      {/* Sidebar container with hover-expand behavior */}
      <nav
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-300 flex flex-col py-6 px-3 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out z-50 shadow-lg ${
          hovered ? "w-[240px]" : "w-[64px]"
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          onClick={handleNavClick}
          className="mb-8 pl-2 flex items-center justify-center"
        >
          <h1
            className={`text-2xl font-bold cursor-pointer transition-opacity duration-200 ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            CIVIC
          </h1>
          {!hovered && (
            <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
          )}
        </Link>

        {/* Navigation Items */}
        <div className="flex flex-col flex-grow space-y-1 relative pb-6">
          <NavItem
            to="/"
            icon={<BiHomeAlt2 size={24} />}
            text="Home"
            active={location.pathname === '/'}
            visible={hovered}
            onClick={handleNavClick}
          />
          <NavItem
            to="/search"
            icon={<BiSearch size={24} />}
            text="Search"
            active={location.pathname === '/search'}
            visible={hovered}
            onClick={handleNavClick}
          />
          <NavItem
            to="/explore"
            icon={<MdOutlineExplore size={24} />}
            text="Explore"
            active={location.pathname === '/explore'}
            visible={hovered}
            onClick={handleNavClick}
          />
          <NavItem
            to="/championship"
            icon={
              location.pathname === '/championship' ? (
                <AcademicCapIconSolid className="w-6 h-6" />
              ) : (
                <AcademicCapIcon className="w-6 h-6" />
              )
            }
            text="Championship"
            active={location.pathname === '/championship'}
            visible={hovered}
            onClick={handleNavClick}
          />

          {/* Create Post Button */}
          {user && (
            <NavButton
              onClick={() => {
                setIsModalOpen(true);
              }}
              icon={<BiPlusCircle size={24} />}
              text="Create Post"
              visible={hovered}
            />
          )}

          <div className="pt-2">
            <NavItem
              to="/map"
              icon={<FiMapPin size={24} />}
              text="Map"
              active={location.pathname === '/map'}
              visible={hovered}
              onClick={handleNavClick}
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
                visible={hovered}
                onClick={handleNavClick}
              />
              {hovered && (
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 text-sm text-red-500 hover:text-red-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            hovered && (
              <div className="mt-auto space-y-2">
                <Link
                  to="/login"
                  onClick={handleNavClick}
                  className="block w-full text-center py-2 px-4 text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={handleNavClick}
                  className="block w-full text-center py-2 px-4 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )
          )}

          {/* More Menu */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${
              showMore ? "bg-gray-100" : ""
            }`}
          >
            <BiMenu size={24} className="mr-4" />
            {hovered && <span>More</span>}
          </button>

          {showMore && hovered && (
            <div className="ml-2 space-y-1">
              <NavItem
                to="/about"
                text="About"
                active={location.pathname === '/about'}
                visible={hovered}
                onClick={handleNavClick}
              />
              <NavItem
                to="/contact"
                text="Contact"
                active={location.pathname === '/contact'}
                visible={hovered}
                onClick={handleNavClick}
              />
            </div>
          )}
        </div>
      </nav>

      {/* Post creation modal */}
      <PostCreatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

// NavItem Component: hides text when sidebar is collapsed
const NavItem = ({ to, icon, text, active, visible, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${
      active ? "font-bold bg-gray-100" : ""
    }`}
  >
    <span className="mr-4 flex-shrink-0">{icon}</span>
    {visible && <span className="whitespace-nowrap">{text}</span>}
  </Link>
);

const NavButton = ({ onClick, icon, text, visible }) => (
  <button
    onClick={onClick}
    className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
  >
    <span className="mr-4 flex-shrink-0">{icon}</span>
    {visible && <span>{text}</span>}
  </button>
);

export default Navbar;