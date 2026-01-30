
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import HorizontalTabs from "../Profile_Pages/Horizotal_tabs";
import { FaMedal, FaPlus, FaArrowLeft, FaEnvelope } from "react-icons/fa";

// Level thresholds
const LEVELS = [
  { level: 0, requiredPoints: 0 },
  { level: 1, requiredPoints: 100 },
  { level: 2, requiredPoints: 200 },
  { level: 3, requiredPoints: 300 },
  { level: 4, requiredPoints: 400 },
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [sticks, setSticks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [postCount, setPostCount] = useState(0); // 🔥 New state for post count
  const navigate = useNavigate();

  // -----------------------
  // 🔹 User + Stats + Posts
  // -----------------------
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Listen to user data
    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      setUser(snap.exists() ? { uid: currentUser.uid, ...snap.data() } : null);
      setLoading(false);
    });

    // Listen to level/stats
    const unsubSticks = onSnapshot(doc(db, "userSticks", currentUser.uid), (snap) => {
      if (snap.exists()) setSticks(snap.data());
      else
        setSticks({
          uid: currentUser.uid,
          points: 0,
          level: 0,
          badge: "None",
          currentStreak: 0,
          longestStreak: 0,
        });
    });

    // 🔥 Real-time listener for user's post count
    const postsQuery = query(
      collection(db, "posts"), 
      where("userId", "==", currentUser.uid)
    );
    
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPostCount(snapshot.size); // Update post count in real-time
    });

    // Clean up listeners on unmount
    return () => {
      unsubUser();
      unsubSticks();
      unsubPosts(); // 🔥 Clean up posts listener
    };
  }, []);

  // -----------------------
  // 🔹 Animate Progress Bar
  // -----------------------
  useEffect(() => {
    if (!sticks) return;
    const points = sticks.points || 0;
    const currentLevel = LEVELS.reduce(
      (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
      LEVELS[0]
    );
    const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);
    const targetProgress = nextLevel
      ? ((points - currentLevel.requiredPoints) /
          (nextLevel.requiredPoints - currentLevel.requiredPoints)) *
        100
      : 100;

    let start = 0;
    let frame;
    const animate = () => {
      start += 2;
      if (start >= targetProgress) {
        setProgress(targetProgress);
        return;
      }
      setProgress(start);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [sticks]);

  // -----------------------
  // 🔹 Image Upload Handling
  // -----------------------
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    try {
      setUploading(true);
      const base64Image = await convertToBase64(file);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            profileImage: base64Image,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Error uploading:", err);
      alert("Failed to upload profile image.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("profile-image-input").click();
  };

  // -----------------------
  // 🔹 Conditional Loading UI
  // -----------------------
  if (loading || !user || !sticks) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  // -----------------------
  // 🔹 Derived Data
  // -----------------------
  const { points, level, badge, currentStreak, longestStreak } = sticks;
  const currentLevel = LEVELS.reduce(
    (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
    LEVELS[0]
  );
  const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);

  // -----------------------
  // 🔹 Component JSX
  // -----------------------
  return (
    <div className="min-h-screen w-full flex flex-col items-center text-black pt-[90px] bg-blue-500 rounded-t-3xl">
      {/* Hidden File Input */}
      <input
        id="profile-image-input"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {/* Header Bar */}
      <div className="relative w-full h-56 bg-blue-500 rounded-b-[50px] flex items-center justify-between px-6">
        <FaArrowLeft
          className="text-white text-xl cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <FaEnvelope className="text-white text-xl cursor-pointer" />
      </div>

      {/* Profile Card */}
      <div className="relative w-full max-w-sm -mt-24 bg-white rounded-t-3xl rounded-b-3xl shadow-lg flex flex-col items-center px-6 pt-20 pb-10 min-h-screen">
        {/* Avatar */}
        <div className="absolute -top-14">
          <div className="relative">
            <img
              src={user.profileImage || "/default-avatar.png"}
              alt={user.username || "User"}
              onClick={triggerFileInput}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md cursor-pointer"
            />
            <div
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FaPlus className="text-white text-xs" />
              )}
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="mt-4 text-center">
          <h2 className="font-bold text-gray-900 text-lg">
            @{user.name ? user.name : user.username || "User"}
          </h2>
        </div>

        {/* Posts / Followers / Following */}
        <div className="flex justify-center w-full mt-4 text-center gap-8">
          <div className="flex flex-col text-gray-800">
            <span className="font-semibold text-lg">{user.postCount || 0}</span> {/* 🔥 Using postCount state */}
            <span className="text-xs text-gray-500">Posts</span>
          </div>
          <Link to="/follow" className="flex flex-col text-gray-800">
            <span className="font-semibold text-lg">{user.followersCount || 0}</span>
            <span className="text-xs text-gray-500">Followers</span>
          </Link>
          <Link to="/following" className="flex flex-col text-gray-800">
            <span className="font-semibold text-lg">{user.followingCount || 0}</span>
            <span className="text-xs text-gray-500">Following</span>
          </Link>
        </div>

        {/* Buttons */}
        <div className="flex justify-center items-center gap-3 mt-4 w-full">
          <button
            onClick={triggerFileInput}
            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-black font-semibold px-5 py-2 rounded-xl text-sm border border-gray-300 shadow transition"
          >
            Edit profile
          </button>

          <button
            onClick={() => navigate("/championship")}
            className="flex flex-col justify-center items-center bg-gray-100 rounded-xl hover:bg-gray-200 transition px-5 py-2 text-sm border border-gray-300 shadow-inner"
          >
            <span className="font-semibold text-gray-800 leading-none">{points || 0}</span>
            <span className="text-[10px] text-gray-500 leading-none">Civic Impact</span>
          </button>
        </div>

        {/* Level & Badge Section */}
        <div className="mt-6 w-full bg-white border rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
              {level}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-black">Level {level}</span>
              {nextLevel && (
                <span className="text-xs text-gray-500">
                  {nextLevel.requiredPoints - points} pts to next level
                </span>
              )}
            </div>
          </div>

          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-4 items-center mt-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
              <FaMedal className="text-blue-500 text-xl" />
            </div>
            <div>
              <span className="block text-sm font-bold text-black">{badge}</span>
              <span className="text-xs text-gray-600">
                Streak: {currentStreak} 🔥 | Longest: {longestStreak}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="w-full mt-6 border-t pt-3">
          <HorizontalTabs />
        </div>
      </div>
    </div>
  );
};

export default Profile;