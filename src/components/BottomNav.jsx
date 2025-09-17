// src/components/BottomNav.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiPlusCircle,
  FiHeart,
  FiSearch,
} from "react-icons/fi"; // ✅ Feather icons
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useState } from "react";
import PostCreatorModal from "./PostCreatorModal";

const BottomNav = () => {
  const { user, firestoreUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navItems = [
    { name: "Home", path: "/", icon: <FiHome /> },
    { name: "Explore", path: "/dashboard", icon: <FiSearch /> },
    ...(user
      ? [
          {
            name: "Post",
            icon: <FiPlusCircle />,
            isCenter: true,
          },
        ]
      : []),
    { name: "Notification", path: "/about", icon: <FiHeart /> },
    { name: "Profile", path: "/profile", icon: <FiUser /> },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <ul className="flex justify-around items-center h-14 px-2 max-w-lg mx-auto">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            const baseStyle =
              "flex flex-col items-center justify-center text-xs transition duration-300 group cursor-pointer";
            const activeStyle = item.isCenter
              ? "absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-tr from-blue-400 via-blue-500 to-blue-600 text-white w-14 h-14 rounded-full shadow-lg border-4 border-white text-xl z-10"
              : isActive
              ? "text-blue-500"
              : "text-gray-500";

            return (
              <li key={index} className={`${baseStyle} ${activeStyle}`}>
                {item.isCenter ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full h-full flex items-center justify-center focus:outline-none"
                  >
                    <span className="text-2xl transition-all duration-300 transform group-hover:-translate-y-1 group-hover:scale-110">
                      {item.icon}
                    </span>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className="flex flex-col items-center justify-center focus:outline-none"
                  >
                    <span
                      className={`text-2xl transition-all duration-300 transform group-hover:-translate-y-1 group-hover:scale-110 group-hover:text-blue-500 ${
                        isActive ? "text-blue-500" : ""
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`text-[11px] mt-1 tracking-wide transition-all duration-300 group-hover:-translate-y-1 group-hover:text-blue-500 ${
                        isActive ? "text-blue-500" : "text-gray-500"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Auth Status - Hide on /profile */}
        {location.pathname !== "/profile" && (
          <div className="absolute right-4 top-[-64px] flex items-center gap-3">
            {user ? (
              <>
                <div className="relative group">
                  <img
                    src={
                      firestoreUser?.profileImage ||
                      user?.photoURL ||
                      "/default-profile.png"
                    }
                    alt={user.displayName ?? "User"}
                    className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    title={user.email}
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 py-1.5 px-4 rounded-full text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full border border-blue-500 text-blue-600 bg-white font-medium shadow-sm hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-200 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Modal only available when user is logged in */}
      {user && (
        <PostCreatorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default BottomNav;