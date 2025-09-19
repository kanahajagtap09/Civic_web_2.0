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

export default function Championship() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 697);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 697);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-purple-700 to-purple-900">
      {/* Main container with proper padding for navbars */}
      <div className="w-full max-w-md mx-auto">
        {/* Content wrapper with padding to avoid nav overlap */}
        <div className={`px-4 ${isMobile ? 'pt-20 pb-28' : 'pt-24 pb-8'}`}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 text-white">
              <FaCrown className="text-yellow-300 text-3xl" /> 
              LEADERBOARD
            </h1>
          </div>

          {/* Podium Section */}
          {podium.length > 0 && (
            <div className="flex justify-center items-end gap-3 sm:gap-4 mb-8">
              {/* 2nd Place */}
              {podium[1] && (
                <div className="flex flex-col items-center animate-fadeIn">
                  <div className="relative">
                    <img
                      src={podium[1].photoURL}
                      alt={podium[1].name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-gray-300 object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md">
                      2
                    </div>
                  </div>
                  <p className="text-sm mt-3 font-medium text-white truncate max-w-[90px]">
                    @{podium[1].name}
                  </p>
                  <p className="font-bold text-yellow-300 text-base">
                    {podium[1].points.toLocaleString()} pts
                  </p>
                </div>
              )}

              {/* 1st Place */}
              {podium[0] && (
                <div className="flex flex-col items-center -mt-6 animate-fadeIn">
                  <FaCrown className="text-yellow-400 text-3xl mb-2 animate-bounce" />
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50"></div>
                    <img
                      src={podium[0].photoURL}
                      alt={podium[0].name}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 object-cover shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-base font-bold text-purple-900 shadow-md">
                      1
                    </div>
                  </div>
                  <p className="text-base sm:text-lg mt-3 font-bold text-white truncate max-w-[110px]">
                    @{podium[0].name}
                  </p>
                  <p className="font-bold text-yellow-300 text-lg">
                    {podium[0].points.toLocaleString()} pts
                  </p>
                </div>
              )}

              {/* 3rd Place */}
              {podium[2] && (
                <div className="flex flex-col items-center animate-fadeIn">
                  <div className="relative">
                    <img
                      src={podium[2].photoURL}
                      alt={podium[2].name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-orange-400 object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md">
                      3
                    </div>
                  </div>
                  <p className="text-sm mt-3 font-medium text-white truncate max-w-[90px]">
                    @{podium[2].name}
                  </p>
                  <p className="font-bold text-yellow-300 text-base">
                    {podium[2].points.toLocaleString()} pts
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6"></div>

          {/* Rest of leaderboard */}
          <div className="space-y-2">
            {rest.map((player, idx) => (
              <div
                key={player.uid}
                className="flex items-center justify-between bg-white/10 backdrop-blur-sm 
                  px-4 py-3 rounded-xl shadow-md hover:bg-white/20 
                  transition-all duration-300 border border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 
                    flex items-center justify-center text-purple-900 font-bold text-sm flex-shrink-0 shadow-md">
                    {idx + 4}
                  </div>
                  <img
                    src={player.photoURL}
                    alt={player.name}
                    className="w-10 h-10 rounded-full border-2 border-white/50 object-cover flex-shrink-0 shadow-md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      @{player.name}
                    </p>
                    <p className="text-xs text-white/70">
                      Level {player.level} • {player.badge}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-bold text-yellow-300 text-sm">
                    {player.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70">points</p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {leaderboard.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <FaCrown className="text-yellow-300 text-3xl" />
              </div>
              <p className="text-white/70 text-base">
                No champions yet. Be the first!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}