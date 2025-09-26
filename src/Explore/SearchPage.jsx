import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaTimes, FaPaperPlane } from "react-icons/fa";
import verifyTick from "../assets/Blue_tick.png"; // 🔹 Add this

// Utility to fetch one user’s full details
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
        verified: data.userRole === "Department", // 🔹 Verified if Department
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
    console.error("Error fetching user data:", err);
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

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch and filter users only when searchTerm changes
  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      if (!searchTerm.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
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
                field.toLowerCase().includes(searchTerm.toLowerCase())
              )
          );
          setUsers(filtered);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchUsers, 400); // debounce
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white">
      {/* 🔹 Fancy Search Bar */}
      <div className="sticky top-0 z-50 flex items-center gap-4 px-4 py-4 border-b bg-white h-20">
        <button onClick={() => navigate(-1)} className="text-gray-700 text-2xl">
          <FaArrowLeft />
        </button>
        {/* Search Bar */}
        <div className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-3 flex-1 h-12">
          <FaSearch className="text-gray-500 mr-2 text-lg" />
          <input
            type="text"
            autoFocus
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent flex-1 outline-none text-base text-gray-800 placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          )}
        </div>
        <button className="text-[#782048] text-2xl">
          <FaPaperPlane />
        </button>
      </div>

      {/* Results */}
      <div className="pb-6">
        {searchTerm.trim() === "" ? (
          <div className="text-center py-6 text-gray-400">
            Start typing to search users 🔍
          </div>
        ) : loading ? (
          <ul>
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flex items-center px-4 py-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="ml-4 flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </li>
            ))}
          </ul>
        ) : users.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No users found for "<span className="font-semibold">{searchTerm}</span>" 💨
          </div>
        ) : (
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate(`/search-user/${user.id}`)}
              >
                <img
                  src={user.photoURL}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover border border-gray-300"
                />
                <div className="ml-4 flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 truncate">
                      {user.username}
                    </span>
                    {user.verified && (
                      <img
                        src={verifyTick}
                        alt="verified"
                        className="w-4 h-4"
                        title="Verified Department"
                      />
                    )}
                  </div>
                  {user.displayName && (
                    <span className="text-sm text-gray-600 truncate">
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
  );
}