import React, { useEffect, useState } from "react";
import SuggestionsBar from "./Sugestionbar";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import HorizontalTabs from "../Profile_Pages/Horizotal_tabs";
import { FaStar, FaMedal } from "react-icons/fa";

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
  const [sticks, setSticks] = useState(null); // 👈 Firestore userSticks
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
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
      {/* ✅ Removed local Top Bar */}
      {/* Everything now handled by ScrollNavbar globally */}

      {/* Profile Header */}
      <div className="w-full max-w-md mx-auto pt-4 px-2">
        <div className="flex items-center justify-between">
          {/* avatar */}
          <img
            src={user.profileImage || "/default-avatar.png"}
            alt={user.username}
            className="w-20 h-20 rounded-full object-cover"
          />
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

        {/* 🚀 Level/Badge Card */}
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