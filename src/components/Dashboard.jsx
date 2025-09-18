// src/pages/Leaderboard.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { FaCrown } from "react-icons/fa";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, "userSticks"),
          orderBy("points", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);

        const usersData = await Promise.all(
          snap.docs.map(async (d) => {
            const stickData = d.data();

            // Try fetching user profile
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

  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-purple-700 to-purple-900 text-white p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <FaCrown className="text-yellow-300" /> LEADERBOARD
      </h1>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="flex justify-center items-end gap-6 mb-8">
          {/* 2nd */}
          {podium[1] && (
            <div className="flex flex-col items-center">
              <img
                src={podium[1].photoURL}
                alt={podium[1].name}
                className="w-14 h-14 rounded-full border-2 border-white"
              />
              <p className="text-xs mt-1">@{podium[1].name}</p>
              <p className="font-bold text-yellow-300">{podium[1].points} pts</p>
            </div>
          )}

          {/* 1st */}
          {podium[0] && (
            <div className="flex flex-col items-center -mt-8">
              <FaCrown className="text-yellow-400 text-2xl mb-1" />
              <img
                src={podium[0].photoURL}
                alt={podium[0].name}
                className="w-16 h-16 rounded-full border-2 border-yellow-400"
              />
              <p className="text-sm mt-1 font-bold">@{podium[0].name}</p>
              <p className="font-bold text-yellow-300">{podium[0].points} pts</p>
            </div>
          )}

          {/* 3rd */}
          {podium[2] && (
            <div className="flex flex-col items-center">
              <img
                src={podium[2].photoURL}
                alt={podium[2].name}
                className="w-14 h-14 rounded-full border-2 border-white"
              />
              <p className="text-xs mt-1">@{podium[2].name}</p>
              <p className="font-bold text-yellow-300">{podium[2].points} pts</p>
            </div>
          )}
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="space-y-3 max-w-md mx-auto">
        {rest.map((player, idx) => (
          <div
            key={player.uid}
            className="flex items-center justify-between bg-purple-800 px-4 py-2 rounded-lg shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-purple-900 font-bold">
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
  );
}