import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  BiHomeAlt2,
  BiSearch,
  BiPlusCircle,
  BiMenu,
} from "react-icons/bi";
import { MdOutlineExplore } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import verifyTick from "../assets/Blue_tick.png";
import PostCreatorModal from "./PostCreatorModal";
import { FaTimes, FaSearch } from "react-icons/fa";

/* ------------------ Utility ------------------ */
const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
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
              : "/default-avatar.png",
      };
    }
  } catch (err) {
    console.error("getUserData error:", err);
  }
  return {
    username: "Unknown",
    displayName: "",
    bio: "",
    verified: false,
    userRole: "user",
    photoURL: "/default-avatar.png",
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
  const [realtimeUser, setRealtimeUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const off = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (snap.exists()) setRealtimeUser(snap.data());
      });
      return () => off();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return null;

  const currentProfileImage =
    realtimeUser?.profileImage ||
    firestoreUser?.profileImage ||
    user?.photoURL ||
    "/default-profile.png";

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

  /* Debounced Firestore user lookup */
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
        const all = await Promise.all(
          snap.docs.map((docSnap) => getUserData(docSnap.id))
        );
        if (active) {
          setSearchUsers(
            all.filter((u) =>
              [u.username, u.displayName, u.bio]
                .filter(Boolean)
                .some((f) =>
                  f.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
          );
        }
      } catch (err) {
        console.error("Error loading users:", err);
      }
      setLoadingSearch(false);
    };
    const t = setTimeout(fetchUsers, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [searchQuery]);

  /* ---------------- JSX ---------------- */
  return (
    <>
      {showSearch && hovered && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={handleBackClick}
        />
      )}

      <nav
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => !showSearch && setHovered(false)}
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-300 flex flex-col py-6 overflow-y-auto overflow-x-hidden transition-all duration-300 z-50 shadow-lg ${hovered
          ? showSearch
            ? "w-[400px] p-0 border-none rounded-none" // 🔹 flat right border now
            : "w-[260px] px-3"
          : "w-[64px] px-3"
          }`}
      >
        {/* Logo */}
        <Link
          to="/"
          onClick={handleNavClick}
          className="mb-8 pl-2 flex items-center justify-center"
        >
          <h1
            className={`text-2xl font-bold transition-opacity ${hovered ? "opacity-100" : "opacity-0"
              }`}
          >
            CIVIC
          </h1>
          {!hovered && <div className="w-6 h-6 bg-blue-500 rounded-full"></div>}
        </Link>

        {/* --- Search panel or Nav icons --- */}
        {showSearch && hovered ? (
          // Updated white theme SearchPanel
          <SearchPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleBackClick={handleBackClick}
            searchUsers={searchUsers}
            loadingSearch={loadingSearch}
            navigate={navigate}
          />
        ) : (
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

            {/* profile/login */}
            {user ? (
              <div className="mt-auto">
                <NavItem
                  to="/profile"
                  icon={
                    <img
                      src={
                        currentProfileImage.startsWith("data:") ||
                          currentProfileImage.startsWith("http")
                          ? currentProfileImage
                          : `data:image/jpeg;base64,${currentProfileImage}`
                      }
                      alt={user.displayName ?? "User"}
                      className="w-6 h-6 rounded-full object-cover border border-gray-300"
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
                    className="w-full mt-2 text-sm text-red-500 hover:text-red-600 py-2 px-4 rounded-lg hover:bg-gray-100"
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
                    className="block text-center py-2 px-4 text-blue-500 hover:bg-gray-100 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block text-center py-2 px-4 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}

            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex items-center p-3 rounded-lg hover:bg-gray-100 ${showMore ? "bg-gray-100" : ""
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

      <PostCreatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

/* ------- Helpers ------- */
const NavItem = ({ to, icon, text, active, visible, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${active ? "font-bold bg-gray-100" : ""
      }`}
  >
    <span className="mr-4 flex-shrink-0">{icon}</span>
    {visible && <span className="whitespace-nowrap">{text}</span>}
  </Link>
);

const NavButton = ({ onClick, icon, text, visible }) => (
  <button
    onClick={onClick}
    className="flex items-center p-3 rounded-lg hover:bg-gray-100 w-full text-left"
  >
    <span className="mr-4 flex-shrink-0">{icon}</span>
    {visible && <span>{text}</span>}
  </button>
);

/* --- Search Panel (Light White Theme) --- */
const SearchPanel = ({
  searchQuery,
  setSearchQuery,
  handleBackClick,
  searchUsers,
  loadingSearch,
  navigate,
}) => {
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      return stored ? JSON.parse(stored).filter((u) => u && u.id) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleUserClick = (user) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((u) => u.id !== user.id);
      return [user, ...filtered].slice(0, 10);
    });
    navigate(`/search-user/${user.id}`);
    handleBackClick();
  };

  const removeRecent = (e, userId) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((u) => u.id !== userId));
  };

  const clearAllRecent = () => setRecentSearches([]);

  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-800 absolute top-0 left-0 z-50 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Search</h2>
          <button
            onClick={handleBackClick}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
          <FaSearch className="text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm text-gray-700 placeholder-gray-500"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-500 hover:text-gray-700 ml-2"
            >
              <FaTimes size={14} className="rounded-full p-0.5 w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loadingSearch && (
          <div className="space-y-3 mt-2 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loadingSearch && searchQuery.trim() !== "" && (
          <ul>
            {searchUsers.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No results found.
              </div>
            ) : (
              searchUsers.map((u) => (
                <li
                  key={u.id}
                  onClick={() => handleUserClick(u)}
                  className="flex items-center justify-between px-3 py-3 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoURL}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover border border-gray-300"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm">
                          {u.username}
                        </span>
                        {u.verified && (
                          <img
                            src={verifyTick}
                            className="w-3 h-3"
                            alt="verified"
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {u.displayName || u.username}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}

        {/* Recent */}
        {!loadingSearch && searchQuery.trim() === "" && (
          <div className="mt-2 text-gray-800">
            <div className="flex justify-between items-center px-3 mb-2">
              <h3 className="text-base font-semibold">Recent</h3>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearAllRecent}
                  className="text-xs text-blue-500 hover:text-blue-400 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                No recent searches.
              </div>
            ) : (
              <ul>
                {recentSearches.map((u) => (
                  <li
                    key={u.id}
                    onClick={() => handleUserClick(u)}
                    className="flex items-center justify-between px-3 py-3 hover:bg-gray-100 cursor-pointer rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.photoURL}
                        alt={u.username}
                        className="w-11 h-11 rounded-full object-cover border border-gray-300"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm">
                            {u.username}
                          </span>
                          {u.verified && (
                            <img
                              src={verifyTick}
                              className="w-3 h-3"
                              alt="verified"
                            />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {u.displayName || u.username}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeRecent(e, u.id)}
                      className="text-gray-400 hover:text-gray-700 p-2"
                    >
                      <FaTimes size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;