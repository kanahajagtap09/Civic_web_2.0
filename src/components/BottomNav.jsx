import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  PlusCircleIcon,
  BellIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import {
  HomeIcon as HomeSolid,
  PlusCircleIcon as PlusCircleSolid,
  BellIcon as BellSolid,
  AcademicCapIcon as AcademicCapSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
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
      icon: <HomeIcon className="w-6 h-6" />,
      iconActive: <HomeSolid className="w-6 h-6" />,
    },
    {
      name: "Explore",
      path: "/dashboard",
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      iconActive: <MagnifyingGlassSolid className="w-6 h-6" />,
    },
    {
      name: "Championship",
      path: "/championship",
      icon: <AcademicCapIcon className="w-6 h-6" />,
      iconActive: <AcademicCapSolid className="w-6 h-6" />,
    },
    ...(user
      ? [
          {
            name: "Post",
            isCenter: true,
            icon: <PlusCircleIcon className="w-9 h-9 text-white" />,
            iconActive: <PlusCircleSolid className="w-9 h-9" />,
          },
        ]
      : []),
    {
      name: "Notification",
      path: "/about",
      icon: <BellIcon className="w-6 h-6" />,
      iconActive: <BellSolid className="w-6 h-6" />,
    },
  ];

  // Only items with real paths for indicator tracking
  const pathItems = navItems.filter(item => item.path);

  useEffect(() => {
    const currentIndex = pathItems.findIndex(
      item => item.path === location.pathname
    );
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-md px-3 mb-3">
          <ul
            className="relative flex justify-around items-center h-20
              bg-white/90 border border-gray-200 rounded-t-2xl shadow-xl backdrop-blur-md"
          >
            {/* Active bar indicator */}
            <div
              className="absolute top-0 h-1 rounded-full  transition-all duration-300 ease-out"
              style={{
                width: "3rem",
                left: `${activeIndex * (100 / pathItems.length) + (100 / pathItems.length) / 2}%`,
                transform: "translateX(-50%)",
              }}
            />

            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;

              // Floating Action Button
              if (item.isCenter) {
                return (
                  <li
                    key={index}
                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-gray-600
                        w-16 h-16 rounded-full border-4 border-white 
                        flex items-center justify-center shadow-lg 
                        transition-transform duration-300 hover:scale-110"
                    >
                      {isActive ? item.iconActive : item.icon}
                    </button>
                  </li>
                );
              }

              // Regular nav buttons
              return (
                <li
                  key={index}
                  className="flex flex-col items-center justify-center text-xs group"
                >
                  <Link
                    to={item.path}
                    onClick={() => setActiveIndex(index)}
                    className="flex flex-col items-center justify-center focus:outline-none"
                  >
                    <span
                      className={`transition-transform duration-300 transform 
                        group-hover:-translate-y-1 group-hover:scale-110
                        ${isActive ? "text-blue-600" : "text-gray-500"}`}
                    >
                      {isActive ? item.iconActive : item.icon}
                    </span>
                    <span
                      className={`text-[11px] mt-1 tracking-wide transition-all duration-300 
                        ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Post modal */}
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