import React, { useEffect, useState } from "react";
import SuggestionsBar from "./Sugestionbar";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import HorizontalTabs from "../Profile_Pages/Horizotal_tabs";
import { FaMedal, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Allpostprofile from "../horizontal_tabs/Allpostprofile"; // ✅ Import your posts grid
import LevelCardFirestore from "./LevelCardFirestore";


// Modal style
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 12,
  boxShadow: 24,
  p: 3,
  width: { xs: "90vw", sm: 400 },
  outline: "none",
};

// -----------------------------
// Fetch Firestore user data (non-realtime fields)
// -----------------------------
const getUserDataOnce = async (currentUser) => {
  try {
    const userId = currentUser.uid;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    const isGoogleUser = currentUser.providerData.some(
      (provider) => provider.providerId === "google.com"
    );

    const googleName = currentUser.displayName || "";
    const googlePhoto = currentUser.photoURL || "";

    let data = userSnap.exists() ? userSnap.data() : {};

    return {
      username: data.username || data.name || googleName || "",
      name: data.name || googleName || "",
      verified: data.verified || false,
      stats: {
        posts: data.postCount || 0,
        followers: data.followersCount || 0,
        following: data.followingCount || 0,
      },
      bio: Array.isArray(data.bio)
        ? data.bio
        : data.bio
        ? data.bio.split("\n")
        : [],
      photoURL: (() => {
        if (isGoogleUser && googlePhoto) return googlePhoto;
        if (data.profileImage) {
          if (data.profileImage.startsWith("http")) return data.profileImage;
          if (data.profileImage.startsWith("data:")) return data.profileImage;
          return `data:image/jpeg;base64,${data.profileImage}`;
        }
        return "/default-avatar.png";
      })(),
    };
  } catch (err) {
    console.error("Error fetching user data:", err);
    return {
      username: "",
      name: "",
      verified: false,
      stats: { posts: 0, followers: 0, following: 0 },
      bio: [],
      photoURL: "/default-avatar.png",
    };
  }
};

// -----------------------------
// Profile Component
// -----------------------------
const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    getUserDataOnce(currentUser).then((userData) => {
      setUser(userData);
      setLoading(false);
    });

    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  posts: data.postCount || 0,
                  followers: data.followersCount || prev.stats.followers,
                  following: data.followingCount || prev.stats.following,
                },
              }
            : null
        );
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-700">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-700">
        User not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center text-black pb-20">
      {/* Top Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base sm:text-lg">{user.username}</span>
          {user.verified && (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="10" fill="#3b82f6" />
              <path d="M7 10l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/map")}
            className="flex items-center gap-1 text-sm font-semibold bg-gradient-to-r from-blue-400 to-blue-600 py-2 px-3 rounded-2xl text-white"
          >
            <FaMapMarkerAlt /> Map
          </button>
          <button
            onClick={handleLogout}
            className="sm:hidden text-sm font-semibold bg-red-500 py-2 px-3 rounded-2xl text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="w-full max-w-md mx-auto pt-4 px-2">
        <div className="flex items-center justify-between">
          <div>
            <img
              src={user.photoURL}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 flex justify-around ml-4">
            <div className="flex flex-col items-center">
              <span className="font-bold">{user.stats.posts}</span>
              <span className="text-xs text-gray-500">Posts</span>
            </div>
            <Link to="/follow" className="flex flex-col items-center">
              <span className="font-bold">{user.stats.followers}</span>
              <span className="text-xs text-gray-500">Followers</span>
            </Link>
            <Link to="/following" className="flex flex-col items-center">
              <span className="font-bold">{user.stats.following}</span>
              <span className="text-xs text-gray-500">Following</span>
            </Link>
          </div>
        </div>

        {/* Name + Bio */}
        <div className="font-bold text-sm mt-3">{user.name}</div>
        <div className="text-xs text-gray-800 mt-1">
          {user.bio.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>

        <LevelCardFirestore/>
      </div>

      {/* Suggestions & Tabs */}
      <div className="w-full max-w-md px-2 mt-4">
        <SuggestionsBar />
      </div>
      <HorizontalTabs />

     
    </div>
  );
};

export default Profile;