import React, { useEffect, useState } from "react";
import SuggestionsBar from "./Sugestionbar";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import HorizontalTabs from "../Profile_Pages/Horizotal_tabs";
import { FaStar, FaMedal, FaPlus, FaCamera } from "react-icons/fa";

// Level configuration (keep consistent with LevelCardFirestore)
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
  const navigate = useNavigate();

  // Fetch user document from /users
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      setUser(docSnap.exists() ? { uid: currentUser.uid, ...docSnap.data() } : null);
      setLoading(false);
    });

    // Listen to userSticks separately
    const unsubSticks = onSnapshot(doc(db, "userSticks", currentUser.uid), (stickSnap) => {
      if (stickSnap.exists()) setSticks(stickSnap.data());
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

    return () => {
      unsubUser();
      unsubSticks();
    };
  }, []);

  // Animate progress bar
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

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle profile image update
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Convert to base64
      const base64Image = await convertToBase64(file);
      
      // Update user document in Firestore
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          profileImage: base64Image,
          updatedAt: new Date().toISOString()
        });
        
        console.log('Profile image updated successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to update profile image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    document.getElementById('profile-image-input').click();
  };

  if (loading || !user || !sticks) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );
  }

  // convenient values
  const { points, level, badge, currentStreak, longestStreak } = sticks;
  const currentLevel = LEVELS.reduce(
    (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
    LEVELS[0]
  );
  const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center text-black pb-20 pt-20">
      {/* Hidden file input */}
      <input
        id="profile-image-input"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Profile Header */}
      <div className="w-full max-w-md mx-auto pt-4 px-2">
        <div className="flex items-center justify-between">
          {/* Avatar with upload functionality - keeping original styling */}
          <div className="relative">
            <img
              src={user.profileImage || "/default-avatar.png"}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover cursor-pointer"
              onClick={triggerFileInput}
            />
            
            {/* Plus icon indicator */}
            <div 
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer"
              onClick={triggerFileInput}
            >
              <FaPlus className="text-white text-xs" />
            </div>
            
            {/* Loading spinner overlay - only shows when uploading */}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-around ml-4">
            <div className="flex flex-col items-center">
              <span className="font-bold">{user.postCount || 0}</span>
              <span className="text-xs text-gray-500">Posts</span>
            </div>
            <Link to="/follow" className="flex flex-col items-center">
              <span className="font-bold">{user.followersCount || 0}</span>
              <span className="text-xs text-gray-500">Followers</span>
            </Link>
            <Link to="/following" className="flex flex-col items-center">
              <span className="font-bold">{user.followingCount || 0}</span>
              <span className="text-xs text-gray-500">Following</span>
            </Link>
          </div>
        </div>

        {/* Level/Badge Card */}
        <div className="bg-white shadow-md rounded-xl p-4 my-4 border">
          {/* Level Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white font-bold">
              {level}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-orange-600">Level {level}</span>
              {nextLevel && (
                <span className="text-xs text-gray-500">
                  {nextLevel.requiredPoints - points} pts to next level
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 flex justify-between items-center px-3 text-xs font-semibold text-black">
              <span>{currentLevel.level}</span>
              <span className="flex items-center gap-1">
                <FaStar className="text-yellow-600 text-xs" />
                {points}/{nextLevel ? nextLevel.requiredPoints : points}
              </span>
              <span>{nextLevel ? nextLevel.level : "MAX"}</span>
            </div>
          </div>

          {/* Badge + Streak */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Badge</h3>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-200">
                <FaMedal className="text-orange-600 text-2xl" />
              </div>
              <div>
                <span className="block text-sm font-bold text-orange-700">{badge}</span>
                <span className="text-xs text-gray-600">
                  Current Streak: {currentStreak} 🔥 | Longest: {longestStreak}
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate("/championship")}
              className="bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md transition"
            >
              Go to LeaderBoard
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions + Tabs */}
      <div className="w-full max-w-md px-2 mt-4">
        <SuggestionsBar />
      </div>
      <HorizontalTabs />
    </div>
  );
};

export default Profile;