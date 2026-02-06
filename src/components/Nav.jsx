import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";

import {
  BiHomeAlt2,
  BiSearch,
  BiPlusCircle,
  BiMenu
} from "react-icons/bi";
import { MdOutlineExplore } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapIconSolid } from "@heroicons/react/24/solid";
import { FaTimes, FaSearch } from "react-icons/fa";

import verifyTick from "../assets/Blue_tick.png";
import PostCreatorModal from "./PostCreatorModal";

/* ------------------ Utility ------------------ */
const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userId,
        username: data.username || data.name || "Unknown",
        displayName: data.displayName || data.name || "",
        bio: Array.isArray(data.bio) ? data.bio.join(" ") : data.bio || "",
        verified: data.userRole === "Department",
        userRole: data.userRole || "user",
        photoURL:
          data.profileImage &&
          (data.profileImage.startsWith("http") ||
            data.profileImage.startsWith("data:"))
            ? data.profileImage
            : data.profileImage
            ? `data:image/jpeg;base64,${data.profileImage}`
            : "/default-avatar.png"
      };
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
  }

  return {
    username: "Unknown",
    displayName: "",
    bio: "",
    verified: false,
    userRole: "user",
    photoURL: "/default-avatar.png"
  };
};

/* ------------------ Navbar ------------------ */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, firestoreUser, loading } = useAuth();

  const [showMore, setShowMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return null;

  const profileImage =
    user?.photoURL || firestoreUser?.profileImage || "/default-profile.png";

  const handleNavClick = () => setHovered(false);

  const handleSearchClick = () => {
    setShowSearch(true);
    setHovered(true);
  };

  const handleBackClick = () => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchUsers([]);
  };

  /* ------------------ Debounced Firestore Search ------------------ */
  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchUsers([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        const allUsers = await Promise.all(
          snap.docs.map(async (docSnap) => await getUserData(docSnap.id))
        );
        if (active) {
          const filtered = allUsers.filter((u) =>
            [u.username, u.displayName, u.bio]
              .filter(Boolean)
              .some((field) =>
                field.toLowerCase().includes(searchQuery.toLowerCase())
              )
          );
          setSearchUsers(filtered);
        }
      } catch (err) {
        console.error("Error loading users:", err);
      }
      setLoadingSearch(false);
    };

    const timeout = setTimeout(fetchUsers, 400);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  /* ------------------ MAIN JSX ------------------ */
  return (
    <>
      <nav
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => !showSearch && setHovered(false)}
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-300 flex flex-col py-6 px-3 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out z-50 shadow-lg ${
          hovered
            ? showSearch
              ? "w-[360px]" // ✅ Wider when search active
              : "w-[260px]"
            : "w-[64px]"
        }`}
      >
        {/* Logo section */}
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
          {!hovered && <div className="w-6 h-6 bg-blue-500 rounded-full"></div>}
        </Link>

        {/* ------------------ Search Panel ------------------ */}
        {showSearch && hovered ? (
          <div className="flex flex-col h-full px-1">
            {/* Header */}
            <div className="flex items-center mb-4">
              <button
                onClick={handleBackClick}
                className="flex items-center p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600 mr-2" />
                <span className="text-gray-700 font-medium">Close</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-2 mb-4">
              <FaSearch className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {searchQuery.trim() === "" ? (
                <div className="text-gray-400 text-sm text-center p-3">
                  Start typing to search users 🔍
                </div>
              ) : loadingSearch ? (
                <ul>
                  {[...Array(5)].map((_, i) => (
                    <li key={i} className="flex items-center px-3 py-2 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                        <div className="h-2 bg-gray-100 rounded w-16" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : searchUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No users found for <span className="font-semibold">"{searchQuery}"</span> 💨
                </div>
              ) : (
                <ul>
                  {searchUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                      onClick={() => {
                        navigate(`/search-user/${user.id}`);
                        handleBackClick();
                      }}
                    >
                      <img
                        src={user.photoURL}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                      />
                      <div className="ml-3 flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {user.username}
                          </span>
                          {user.verified && (
                            <img
                              src={verifyTick}
                              alt="verified"
                              className="w-3 h-3"
                              title="Verified Department"
                            />
                          )}
                        </div>
                        {user.displayName && (
                          <span className="text-xs text-gray-600 truncate">
                            {user.displayName}
                          </span>
                        )}
                        {user.bio && (
                          <span className="text-xs text-gray-400 truncate">
                            {user.bio}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* ------------------ Standard Nav ------------------ */
          <div className="flex flex-col flex-grow space-y-1 relative pb-6">
            <NavItem
              to="/"
              icon={<BiHomeAlt2 size={24} />}
              text="Home"
              active={location.pathname === "/"}
              visible={hovered}
              onClick={handleNavClick}
            />

            <NavButton
              onClick={handleSearchClick}
              icon={<BiSearch size={24} />}
              text="Search"
              visible={hovered}
            />

            <NavItem
              to="/explore"
              icon={<MdOutlineExplore size={24} />}
              text="Explore"
              active={location.pathname === "/explore"}
              visible={hovered}
              onClick={handleNavClick}
            />

            <NavItem
              to="/championship"
              icon={
                location.pathname === "/championship" ? (
                  <AcademicCapIconSolid className="w-6 h-6" />
                ) : (
                  <AcademicCapIcon className="w-6 h-6" />
                )
              }
              text="Championship"
              active={location.pathname === "/championship"}
              visible={hovered}
              onClick={handleNavClick}
            />

            {user && (
              <NavButton
                onClick={() => setIsModalOpen(true)}
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
                active={location.pathname === "/map"}
                visible={hovered}
                onClick={handleNavClick}
              />
            </div>

            {user ? (
              <div className="mt-auto">
                <NavItem
                  to="/profile"
                  icon={
                    <img
                      src={profileImage}
                      alt={user.displayName ?? "User"}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  }
                  text="Profile"
                  active={location.pathname === "/profile"}
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
                  active={location.pathname === "/about"}
                  visible={hovered}
                  onClick={handleNavClick}
                />
                <NavItem
                  to="/contact"
                  text="Contact"
                  active={location.pathname === "/contact"}
                  visible={hovered}
                  onClick={handleNavClick}
                />
              </div>
            )}
          </div>
        )}
      </nav>

      <PostCreatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

/* ------------------ Helpers ------------------ */
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