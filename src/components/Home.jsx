import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import { FaTrophy } from "react-icons/fa";
import FloatingButton from "../FloatingButton";
import PostList from "./PostList";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

// 🟨 Compact Updates data (could be dynamic later)
const updates = [
  { id: "123456", text: "New issue reported", status: "reported" },
  { id: "123457", text: "Issue marked in progress", status: "progress" },
  { id: "123458", text: "Issue resolved", status: "resolved" },
  { id: "123459", text: "Issue closed", status: "closed" },
];

const statusConfig = {
  reported: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />,
  },
  progress: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: <WrenchScrewdriverIcon className="w-5 h-5 text-blue-500" />,
  },
  resolved: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  },
  closed: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    icon: <LockClosedIcon className="w-5 h-5 text-gray-500" />,
  },
};

// 🏆 Trophy colors for top 3
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

export default function Home() {
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  // 🧠 Fetch leaderboard from Firestore once mounted
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, "userSticks"),
          orderBy("points", "desc"),
          limit(5)
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

  return (
      <div className="w-screen min-h-screen relative pb-20 px-3 md:px-6 bg-white">
        {/* 🏡 Layout */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[minmax(0,640px)_350px] gap-8">
          {/* ⇦ FEED SECTION */}
       
<div
  className="md:-ml-8 lg:-ml-12 xl:-ml-16 transition-all duration-300"
  style={{
    height: 'calc(200vh - 120px)', // adjusted height for better visibility
    overflowY: 'scroll',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
    paddingBottom: '20px', // extra space at bottom
  }}
>
  <style jsx>{`
    div::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  `}</style>
  <PostList />
</div>

        {/* 🧱 RIGHT SIDEBAR (Sticky Section) */}
        <div className="hidden md:flex mt-10 pr-2">
          <div className="sticky top-10 flex flex-col gap-6 w-full h-fit">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Updates • Leaderboard
              </h2>
            </div>

            {/* 🔹 Updates card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MegaphoneIcon className="w-5 h-5 text-pink-600" />
                  <h3 className="font-semibold text-gray-800 text-base">
                    Updates
                  </h3>
                </div>
                <button
                  onClick={() => navigate("/updates")}
                  className="text-gray-400 hover:text-gray-700 text-sm transition"
                >
                  <ArrowLeftIcon className="w-4 h-4 inline-block rotate-180" />
                </button>
              </div>

              <div className="space-y-3">
                {updates.map((update, index) => {
                  const { bg, border, icon } = statusConfig[update.status];
                  const isLatest = index === 0;
                  return (
                    <Link
                      key={index}
                      to={`/details/${update.id}`}
                      className={`flex items-center p-3 rounded-xl border ${border} bg-white hover:shadow-md transition`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 mr-3 rounded-lg ${bg} border ${border} relative`}
                      >
                        {icon}
                        {isLatest && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {update.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          Issue #{update.id}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 🏅 Leaderboard card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Leaderboard</h3>
                <span className="text-gray-400 text-xs">Top Players</span>
              </div>
              {leaderboard.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {leaderboard.map((p, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={p.uid}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          {rank <= 3 ? (
                            <FaTrophy
                              className={`${trophyColor(rank)} text-lg`}
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">
                              {rank}
                            </div>
                          )}
                          <img
                            src={p.photoURL}
                            alt={p.name}
                            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              L{p.level} • {p.badge}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {p.points.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <FaTrophy className="mx-auto mb-2 text-2xl text-gray-400" />
                  <p>No champions yet. Be the first!</p>
                </div>
              )}
            </div>

            {/* 📜 Footer */}
            <div className="text-[11px] text-gray-400 mt-6 leading-relaxed px-2">
              <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
              <p>Locations · Language · Civic Team © 2026</p>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}