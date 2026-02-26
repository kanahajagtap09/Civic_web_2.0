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
import { FaMedal, FaPlus, FaEdit, FaAward } from "react-icons/fa";

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
  const [postCount, setPostCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      setUser(snap.exists() ? { uid: currentUser.uid, ...snap.data() } : null);
      setLoading(false);
    });

    const unsubSticks = onSnapshot(
      doc(db, "userSticks", currentUser.uid),
      (snap) => {
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
      }
    );

    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid)
    );
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPostCount(snapshot.size);
    });

    return () => {
      unsubUser();
      unsubSticks();
      unsubPosts();
    };
  }, []);

  useEffect(() => {
    if (!sticks) return;
    const points = sticks.points || 0;
    const currentLevel = LEVELS.reduce(
      (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
      LEVELS[0]
    );
    const nextLevel = LEVELS.find(
      (lvl) => lvl.level === currentLevel.level + 1
    );
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
          { profileImage: base64Image, updatedAt: new Date().toISOString() },
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

  if (loading || !user || !sticks) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  const { points, level, badge, currentStreak, longestStreak } = sticks;
  const currentLevel = LEVELS.reduce(
    (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
    LEVELS[0]
  );
  const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);

  return (
    <>
      {/* Mobile view */}
      <div className="md:hidden min-h-screen w-full flex flex-col items-center text-black bg-transparent rounded-t-3xl">
        <input
          id="profile-image-input"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-lg flex flex-col items-center px-6 pt-20 pb-10 min-h-screen">
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaPlus className="text-white text-xs" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="font-bold text-gray-900 text-lg">
              @{user.name || user.username || "User"}
            </h2>
          </div>

          <div className="flex justify-center w-full mt-4 text-center gap-8">
            <div className="flex flex-col text-gray-800">
              <span className="font-semibold text-lg">
                {postCount || user.postCount || 0}
              </span>
              <span className="text-xs text-gray-500">Posts</span>
            </div>
            <Link to="/follow" className="flex flex-col text-gray-800">
              <span className="font-semibold text-lg">
                {user.followersCount || 0}
              </span>
              <span className="text-xs text-gray-500">Followers</span>
            </Link>
            <Link to="/following" className="flex flex-col text-gray-800">
              <span className="font-semibold text-lg">
                {user.followingCount || 0}
              </span>
              <span className="text-xs text-gray-500">Following</span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={() => navigate("/Edit_profile")}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              <FaEdit className="text-sm" />
              Edit
            </button>
            <button
              onClick={() => navigate("/championship")}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              <FaAward className="text-sm" />
              Civic Impact
            </button>
          </div>

          <div className="w-full mt-6 border-t pt-3">
            <HorizontalTabs />
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex w-full h-screen overflow-hidden bg-gray-50 text-black">
        <input
          id="profile-image-input"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        {/* LEFT COLUMN - Now a single scrollable container like Home.jsx */}
        <div
          className="w-[36%] xl:w-[32%] flex-shrink-0 h-full overflow-y-auto bg-gray-50 border-r border-gray-100 p-4 pt-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '100px' }}
        >
          <div className="flex flex-col gap-5 w-full max-w-sm mx-auto">
            {/* Profile card with avatar hanging off top */}
            <div className="relative bg-white rounded-2xl shadow border border-gray-100 pt-16 pb-6 px-6 flex flex-col items-center mt-12">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className="relative">
                  <img
                    src={user.profileImage || "/default-avatar.png"}
                    alt={user.username || "User"}
                    onClick={triggerFileInput}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer ring-2 ring-gray-100"
                  />
                  <div
                    onClick={triggerFileInput}
                    className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    {uploading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaPlus className="text-white text-[10px]" />
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-900 text-center mt-1">
                @{user.name || user.username || "User"}
              </h2>
              {user.bio && (
                <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex w-full gap-3 mt-4">
                <div className="flex-1 flex flex-col items-center py-3 bg-gray-50 rounded-xl border">
                  <span className="text-xl font-bold">{postCount || 0}</span>
                  <span className="text-[11px] text-gray-400">Posts</span>
                </div>
                <Link
                  to="/follow"
                  className="flex-1 flex flex-col items-center py-3 bg-gray-50 rounded-xl border hover:bg-gray-100"
                >
                  <span className="text-xl font-bold">
                    {user.followersCount || 0}
                  </span>
                  <span className="text-[11px] text-gray-400">Followers</span>
                </Link>
                <Link
                  to="/following"
                  className="flex-1 flex flex-col items-center py-3 bg-gray-50 rounded-xl border hover:bg-gray-100"
                >
                  <span className="text-xl font-bold">
                    {user.followingCount || 0}
                  </span>
                  <span className="text-[11px] text-gray-400">Following</span>
                </Link>
              </div>

              {/* Level section */}
              <div className="w-full mt-4 flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                  {level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-800">
                      Level {level} — {badge}
                    </span>
                    {nextLevel && (
                      <span className="text-[10px] text-blue-400">
                        {nextLevel.requiredPoints - points} pts left
                      </span>
                    )}
                  </div>
                  <div className="relative w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-blue-400 mt-1">
                    Streak: {currentStreak} 🔥 | Longest: {longestStreak}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => navigate("/Edit_profile")}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-3 rounded-lg font-semibold hover:bg-blue-600 transition text-sm"
                >
                  <FaEdit className="text-sm" />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/championship")}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-2 px-3 rounded-lg font-semibold hover:bg-orange-600 transition text-sm"
                >
                  <FaAward className="text-sm" />
                  Civic Impact
                </button>
              </div>
            </div>

            {/* Calendar / streak view — FIXED */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden p-4">
              <HorizontalTabs showCalendarOnly />
            </div>

            {/* 📜 Footer (Similar to Home.jsx) */}
            <div className="text-[11px] text-gray-400 mt-2 leading-relaxed px-2 text-center">
              <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
              <p>Locations · Language · Civic Team © 2026</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          className="flex-1 pt-12 pb-10 pr-6 pl-4 h-full overflow-y-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            div[style*="scrollbarWidth: 'none'"] {
              -ms-overflow-style: none;
            }
            div[style*="scrollbarWidth: 'none'"] ::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <HorizontalTabs showPostsOnly />
        </div>
      </div>
    </>
  );
};

export default Profile;