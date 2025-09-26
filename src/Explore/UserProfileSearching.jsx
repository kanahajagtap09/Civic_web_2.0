import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FaStar, FaMedal, FaArrowLeft } from "react-icons/fa";
import HorizontalTabs from "../Profile_Pages/Horizotal_tabs";
import SuggestionsBar from "../components/Sugestionbar";
import verifyTick from "../assets/Blue_tick.png"; // 🔹 Added

// Level config
const LEVELS = [
  { level: 0, requiredPoints: 0 },
  { level: 1, requiredPoints: 100 },
  { level: 2, requiredPoints: 200 },
  { level: 3, requiredPoints: 300 },
  { level: 4, requiredPoints: 400 },
];

const UserProfileSearching = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sticks, setSticks] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
    const unsub = auth.onAuthStateChanged((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    const unsubUser = onSnapshot(doc(db, "users", id), (docSnap) => {
      if (docSnap.exists()) setUser({ uid: id, ...docSnap.data() });
      else setUser(null);
      setLoading(false);
    });
    const unsubSticks = onSnapshot(doc(db, "userSticks", id), (stickSnap) => {
      if (stickSnap.exists()) setSticks(stickSnap.data());
      else {
        setSticks({
          uid: id,
          points: 0,
          level: 0,
          badge: "None",
          currentStreak: 0,
          longestStreak: 0,
        });
      }
    });
    return () => {
      unsubUser();
      unsubSticks();
    };
  }, [id]);

  useEffect(() => {
    if (!currentUser || !id || currentUser.uid === id) return;
    const myFollowDoc = doc(db, "users", id, "followers", currentUser.uid);
    const unsub = onSnapshot(myFollowDoc, (snap) => {
      setIsFollowing(snap.exists());
    });
    return () => unsub();
  }, [currentUser, id]);

  const handleFollowToggle = async () => {
    if (!currentUser || !id) return;
    if (currentUser.uid === id) return;
    setBtnLoading(true);
    const meRef = doc(db, "users", currentUser.uid);
    const themRef = doc(db, "users", id);
    const myFollowingDoc = doc(db, "users", currentUser.uid, "following", id);
    const theirFollowersDoc = doc(db, "users", id, "followers", currentUser.uid);
    try {
      if (isFollowing) {
        await updateDoc(meRef, {
          following: arrayRemove(id),
          followingCount: increment(-1),
        });
        await updateDoc(themRef, { followersCount: increment(-1) });
        await deleteDoc(myFollowingDoc);
        await deleteDoc(theirFollowersDoc);
        setIsFollowing(false);
      } else {
        await updateDoc(meRef, {
          following: arrayUnion(id),
          followingCount: increment(1),
        });
        await updateDoc(themRef, { followersCount: increment(1) });
        await setDoc(myFollowingDoc, { followedAt: serverTimestamp() });
        await setDoc(theirFollowersDoc, { followedAt: serverTimestamp() });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Error following/unfollowing:", err);
    } finally {
      setBtnLoading(false);
    }
  };

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

  if (loading || !user || !sticks)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );

  const { points, level, badge, currentStreak, longestStreak } = sticks;
  const currentLevel = LEVELS.reduce(
    (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
    LEVELS[0]
  );
  const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);

  return (
    <div className="min-h-screen bg-white flex flex-col text-black pb-20">
      <div className="sticky top-0 z-40 w-full h-14 flex items-center border-b bg-white px-4">
        <button onClick={() => navigate(-1)} className="text-xl text-gray-700 mr-4">
          <FaArrowLeft />
        </button>
        <h1 className="font-semibold text-lg text-gray-900 truncate max-w-[70%] flex items-center gap-1">
          {user.username || user.name || "Unknown User"}
          {user.userRole === "Department" && (
            <img
              src={verifyTick}
              alt="verified"
              className="w-5 h-5"
              title="Verified Department"
            />
          )}
        </h1>
      </div>

      <div className="w-full max-w-md mx-auto pt-6 sm:pt-8 px-2">
        <div className="flex items-center justify-between">
          <div className="relative">
            <img
              src={user.profileImage || "/default-avatar.png"}
              alt={user.username || user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 flex justify-around ml-4">
            <div className="flex flex-col items-center">
              <span className="font-bold">{user.postCount || 0}</span>
              <span className="text-xs text-gray-500">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold">{user.followersCount || 0}</span>
              <span className="text-xs text-gray-500">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold">{user.followingCount || 0}</span>
              <span className="text-xs text-gray-500">Following</span>
            </div>
          </div>
        </div>

        <div className="mt-4 px-1">
          <h2 className="font-bold text-xl sm:text-2xl text-gray-900 tracking-tight flex items-center gap-1">
            {user.username || user.name || "Unknown User"}
            {user.userRole === "Department" && (
              <img
                src={verifyTick}
                alt="verified"
                className="w-5 h-5"
                title="Verified Department"
              />
            )}
          </h2>
          {user.displayName && <p className="text-sm text-gray-600">{user.displayName}</p>}
          {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          {currentUser && currentUser.uid !== id && (
            <button
              onClick={handleFollowToggle}
              disabled={btnLoading}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition
                ${isFollowing ? "bg-gray-200 text-black" : "bg-blue-500 text-white"}
                ${btnLoading ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {btnLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
         
        </div>

        {/* Level/Badge */}
        <div className="bg-white shadow-md rounded-xl p-4 my-4 border">
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
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Badge</h3>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-200">
                <FaMedal className="text-orange-600 text-2xl" />
              </div>
              <div>
                <span className="block text-sm font-bold text-orange-700">
                  {badge}
                </span>
                <span className="text-xs text-gray-600">
                  Current Streak: {currentStreak} 🔥 | Longest: {longestStreak}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-md px-2 mt-4">
        <SuggestionsBar />
      </div>
      <HorizontalTabs />
    </div>
  );
};

export default UserProfileSearching;