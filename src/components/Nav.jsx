import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { BiHomeAlt2, BiSearch, BiMoviePlay, BiMessageSquareDetail, BiHeart, BiPlusCircle, BiMenu } from 'react-icons/bi';
import { MdOutlineExplore } from 'react-icons/md';
import { CgProfile } from 'react-icons/cg';
import { FiMapPin } from "react-icons/fi";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, firestoreUser, loading } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return null;

  const profileImage = user?.photoURL || firestoreUser?.profileImage || "/default-profile.png";

  return (
    <nav className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-gray-300 flex flex-col py-6 px-3 overflow-y-auto overflow-x-hidden">
      {/* Logo */}
      <Link to="/" className="mb-8 pl-2">
        <h1 className="text-2xl font-bold cursor-pointer">City pluse</h1>
      </Link>

      {/* Navigation Items */}
      <div className="flex flex-col flex-grow space-y-1">
        <NavItem to="/" icon={<BiHomeAlt2 size={24} />} text="Home" active={location.pathname === '/'} />
        <NavItem to="/search" icon={<BiSearch size={24} />} text="Search" active={location.pathname === '/search'} />
        <NavItem to="/explore" icon={<MdOutlineExplore size={24} />} text="Explore" active={location.pathname === '/explore'} />
        <NavItem to="/about" icon={<BiHeart size={24} />} text="Notifications" active={location.pathname === '/following'} />
        <NavItem to="/map" icon={<FiMapPin size={24} />} text="Map" active={location.pathname === '/map'} />
        
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
          className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${showMore ? 'bg-gray-100' : ''}`}
        >
          <BiMenu size={24} className="mr-4" />
          <span>More</span>
        </button>

        {/* More Menu Dropdown */}
        {showMore && (
          <div className="ml-2 space-y-1">
            <NavItem to="/about" text="About" active={location.pathname === '/about'} />
            <NavItem to="/contact" text="Contact" active={location.pathname === '/contact'} />
          </div>
        )}
      </div>
    </nav>
  );
};

// NavItem Component
const NavItem = ({ to, icon, text, active }) => (
  <Link
    to={to}
    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${
      active ? 'font-bold' : ''
    }`}
  >
    <span className="mr-4">{icon}</span>
    <span>{text}</span>
  </Link>
);

export default Navbar;
