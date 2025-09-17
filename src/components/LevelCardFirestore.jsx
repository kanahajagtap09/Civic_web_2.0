import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { FaMedal, FaStar, FaCrown } from "react-icons/fa";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

// Levels config (✅ Added Level 0 for fresh new users)
const LEVELS = [
  { level: 0, requiredPoints: 0 },
  { level: 1, requiredPoints: 100 },
  { level: 2, requiredPoints: 200 },
  { level: 3, requiredPoints: 300 },
  { level: 4, requiredPoints: 400 },
];

// Modal style wrapper
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  outline: "none",
  borderRadius: 16,
  width: { xs: "90vw", sm: 380 },
};

const LevelCardFirestore = () => {
  const [userSticks, setUserSticks] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [open, setOpen] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // Firestore subscription for current user's Sticks
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "userSticks", uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserSticks(docSnap.data());
      } else {
        // ✅ Default values for new users with no document yet
        setUserSticks({
          uid,
          points: 0,
          level: 0,
          badge: "None",
          currentStreak: 0,
          longestStreak: 0,
        });
      }
    });
    return () => unsub();
  }, [uid]);

  // Leaderboard Fetch (top 10 users by points)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, "userSticks"),
          orderBy("points", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);

        // map into array -> enrich with profile info
        const usersData = await Promise.all(
          snap.docs.map(async (d) => {
            const stickData = d.data();
            // fetch that single user's doc
            const uSnap = await getDocs(collection(db, "users"));
            const uDoc = uSnap.docs.find((u) => u.id === stickData.uid);

            return {
              uid: stickData.uid,
              points: stickData.points || 0,
              level: stickData.level ?? 0,
              currentStreak: stickData.currentStreak || 0,
              badge: stickData.badge || "None",
              name: uDoc?.data()?.name || "Unknown",
              photoURL:
                uDoc?.data()?.profileImage?.startsWith("http") ||
                uDoc?.data()?.profileImage?.startsWith("data:")
                  ? uDoc.data().profileImage
                  : uDoc?.data()?.profileImage
                  ? `data:image/jpeg;base64,${uDoc.data().profileImage}`
                  : "/default-avatar.png",
            };
          })
        );

        setLeaderboard(usersData);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      }
    };

    fetchLeaderboard();
  }, []);

  // ---- Self Progress calc ----
  const points = userSticks?.points || 0;
  const level = userSticks?.level ?? 0;
  const badge = userSticks?.badge || "None";
  const currentStreak = userSticks?.currentStreak || 0;
  const longestStreak = userSticks?.longestStreak || 0;

  const currentLevel = LEVELS.reduce(
    (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
    LEVELS[0]
  );
  const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);
  const progressToNext = nextLevel
    ? ((points - currentLevel.requiredPoints) /
        (nextLevel.requiredPoints - currentLevel.requiredPoints)) *
      100
    : 100;

  // Animate progress bar
  useEffect(() => {
    let start = 0;
    let frame;
    setAnimatedProgress(0);
    const animate = () => {
      start += 2;
      if (start >= progressToNext) {
        setAnimatedProgress(progressToNext);
        return;
      }
      setAnimatedProgress(start);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [progressToNext]);

  // Split podium (top 3 vs rest)
  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      {/* ------- USER CARD -------- */}
      {!userSticks ? (
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          Loading level data...
        </div>
      ) : (
        <div
          className="bg-white shadow-md rounded-xl p-4 my-4 border cursor-pointer hover:shadow-xl transition"
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white font-bold">
              {level}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-orange-600">
                Level {level}
              </span>
              {nextLevel && (
                <span className="text-xs text-gray-500">
                  {nextLevel.requiredPoints - points} pts to next level
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
              style={{ width: `${animatedProgress}%` }}
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

          {/* Badge */}
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
      )}

      {/* ------- LEADERBOARD MODAL -------- */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <div className="bg-gradient-to-b from-purple-600 via-purple-700 to-purple-900 text-white rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
                <FaCrown className="text-yellow-300" /> LEADERBOARD
              </h2>
              <IconButton onClick={() => setOpen(false)}>
                <CloseIcon className="text-white" />
              </IconButton>
            </div>

            {/* Podium Top 3 */}
            {podium.length >= 1 && (
              <div className="flex justify-center items-end gap-6 mb-6">
                {/* 2nd */}
                {podium[1] && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden">
                      <img
                        src={podium[1]?.photoURL}
                        alt={podium[1]?.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <p className="text-xs mt-1">@{podium[1]?.name}</p>
                    <p className="font-bold text-yellow-300">
                      {podium[1]?.points}
                    </p>
                  </div>
                )}

                {/* 1st */}
                {podium[0] && (
                  <div className="flex flex-col items-center -mt-6">
                    <FaCrown className="text-yellow-400 text-2xl mb-1" />
                    <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden">
                      <img
                        src={podium[0]?.photoURL}
                        alt={podium[0]?.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <p className="text-xs mt-1">@{podium[0]?.name}</p>
                    <p className="font-bold text-yellow-300">
                      {podium[0]?.points}
                    </p>
                  </div>
                )}

                {/* 3rd */}
                {podium[2] && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center overflow-hidden">
                      <img
                        src={podium[2]?.photoURL}
                        alt={podium[2]?.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <p className="text-xs mt-1">@{podium[2]?.name}</p>
                    <p className="font-bold text-yellow-300">
                      {podium[2]?.points}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Remaining leaderboard */}
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {rest.map((player, idx) => (
                <div
                  key={player.uid}
                  className="flex items-center justify-between bg-purple-800 px-4 py-2 rounded-lg shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-purple-900 font-bold">
                      {idx + 4}
                    </div>
                    <img
                      src={player.photoURL}
                      alt={player.name}
                      className="w-8 h-8 rounded-full border border-white"
                    />
                    <span className="font-semibold text-sm">@{player.name}</span>
                  </div>
                  <span className="font-bold text-yellow-300">
                    {player.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default LevelCardFirestore;