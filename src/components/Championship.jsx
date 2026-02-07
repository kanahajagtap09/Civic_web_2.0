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
import { FaTrophy,  } from "react-icons/fa";

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
            const uSnap = await getDocs(collection(db, "users"));
            const uDoc = uSnap.docs.find((u) => u.id === stickData.uid);

            return {
              uid: stickData.uid,
              points: stickData.points || 0,
              level: stickData.level ?? 0,
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

  const trophyColor = (rank) => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-orange-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-6 pb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
       
        <h1 className="font-bold text-xl text-gray-900">Leaderboard</h1>
        
      </div>

      <div className="max-w-md mx-auto p-4 pt-6">
        {/* Column labels */}
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="font-extrabold text-lg text-gray-800">Leaderboard</h2>
          <span className="text-gray-500 text-sm font-medium">
            Civic Impact Score
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {leaderboard.map((player, index) => {
            const rank = index + 1;

            return (
              <div
                key={player.uid}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow transition-all duration-200 overflow-hidden"
              >
                {/* Left Column: Trophy + Border */}
                <div className="flex-shrink-0 w-14 flex items-center justify-center border-r border-gray-200 bg-white h-full py-3">
                  {rank <= 3 ? (
                    <div className="relative flex justify-center items-center">
                      <FaTrophy
                        className={`${trophyColor(rank)} text-3xl`} // bigger cup area
                      />
                      <span className="absolute text-[11px] font-semibold text-gray-800">
                        {rank}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-700 text-sm font-bold">
                        {rank}
                      </span>
                    </div>
                  )}
                </div>

                {/* Center: Avatar & Text */}
                <div className="flex items-center gap-3 min-w-0 flex-1 px-3 py-3">
                  <div className="relative">
                    <img
                      src={player.photoURL}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-300"
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
                      {player.level}
                    </div>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Level {player.level} • {player.badge}
                    </p>
                  </div>
                </div>

                {/* Right: Points */}
                <div className="flex-shrink-0 text-right w-16 pr-4">
                  <p className="font-semibold text-gray-900 text-base tracking-tight">
                    {player.points.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {leaderboard.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <FaTrophy className="mx-auto mb-3 text-3xl text-gray-400" />
              <p>No champions yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}