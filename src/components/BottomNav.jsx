import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  PlusCircleIcon as PlusCircleSolid,
  AcademicCapIcon as AcademicCapSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useState, useEffect } from "react";
import PostCreatorModal from "./PostCreatorModal";

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: <HomeIcon className="w-6 h-6 text-gray-400" />,
      iconActive: <HomeSolid className="w-6 h-6 text-blue-500" />,
    },
    {
      name: "Explore",
      path: "/dashboard",
      icon: <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />,
      iconActive: <MagnifyingGlassSolid className="w-6 h-6 text-blue-500" />,
    },

    ...(user
      ? [
        {
          name: "Post",
          isCenter: true,
          icon: <PlusCircleIcon className="w-10 h-10 text-gray-400" />,
          iconActive: <PlusCircleSolid className="w-10 h-10 text-blue-500" />,
        },
      ]
      : []),


    {
      name: "Championship",
      path: "/championship",
      icon: <AcademicCapIcon className="w-6 h-6 text-gray-400" />,
      iconActive: <AcademicCapSolid className="w-6 h-6 text-blue-500" />,
    },

    {
      name: "Profile",
      path: "/profile",
      icon: <UserIcon className="w-6 h-6 text-gray-400" />,
      iconActive: <UserSolid className="w-6 h-6 text-blue-500" />,
    },
  ];

  const pathItems = navItems.filter((item) => item.path);

  useEffect(() => {
    const currentIndex = pathItems.findIndex(
      (item) => item.path === location.pathname
    );
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  return (
    <>
      {/* LIGHT MODE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-white border-t border-gray-200 shadow-sm">
        <div className="w-full max-w-md">
          <ul className="flex justify-around items-center py-3">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;

              // Center "+" button
              if (item.isCenter) {
                return (
                  <li key={index} className="relative">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-12 h-12 flex items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none bg-white"
                    >
                      {isActive ? item.iconActive : item.icon}
                    </button>
                  </li>
                );
              }

              // Profile Button
              if (item.name === "Profile") {
                return (
                  <li key={index} className="relative">
                    <Link
                      to={item.path}
                      onClick={() => setActiveIndex(index)}
                      className="flex items-center justify-center"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center transition transform hover:scale-110">
                        {isActive ? item.iconActive : item.icon}
                      </div>
                    </Link>
                  </li>
                );
              }

              // Standard icons
              return (
                <li key={index} className="relative flex items-center justify-center">
                  <Link
                    to={item.path}
                    onClick={() => setActiveIndex(index)}
                    className="flex items-center justify-center"
                  >
                    <span
                      className={`transition-transform duration-300 transform hover:scale-110 ${isActive ? "text-blue-500" : "text-gray-400"
                        }`}
                    >
                      {isActive ? item.iconActive : item.icon}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Post creation modal */}
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