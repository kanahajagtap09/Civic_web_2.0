// src/components/Updates.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  LockClosedIcon,
  BellIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid"; // ✅ Heroicons for consistency
import {
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

const updates = [
  { id: "123456", text: "New issue reported", status: "reported" },
  { id: "123456", text: "Issue marked in progress", status: "progress" },
  { id: "123456", text: "Issue marked resolved", status: "resolved" },
  { id: "123456", text: "Issue marked closed", status: "closed" },
];

// ✅ Unified status config (muted colors, subtle icons)
const statusConfig = {
  reported: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: <ExclamationCircleIcon className="w-6 h-6 text-orange-500" />,
  },
  progress: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: <WrenchScrewdriverIcon className="w-6 h-6 text-blue-500" />,
  },
  resolved: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  },
  closed: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    icon: <LockClosedIcon className="w-6 h-6 text-gray-500" />,
  },
};

export default function Updates() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Sticky Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 border-b 
          bg-white/90 backdrop-blur-md shadow-sm h-16">
        <button onClick={() => navigate(-1)} className="text-gray-700 text-xl">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Updates</h1>
        <button className="text-[#782048] text-xl">
          <MegaphoneIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 🔹 Timeline Feed */}
      <div className="px-4 py-6 space-y-4">
        {updates.map((update, index) => {
          const { bg, border, text, icon } = statusConfig[update.status];
          const isLatest = index === 0;

          return (
            <Link
              key={index}
              to={`/details/${update.id}`}
              className={`flex items-center p-4 bg-white rounded-2xl shadow hover:shadow-md transition border ${border}`}
            >
              {/* Icon in Subtle Box */}
              <div
                className={`flex items-center justify-center w-12 h-12 mr-4 
                  rounded-xl ${bg} border ${border} shadow-sm relative`}
              >
                {icon}
                {isLatest && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 shadow animate-pulse" />
                )}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm sm:text-base">
                  {update.text}
                </div>
                <div className="text-xs text-gray-500 mt-1">Issue #{update.id}</div>
              </div>

              {/* Status Tag */}
              <span
                className={`ml-3 text-xs font-medium px-3 py-1 rounded-full ${bg} ${text} border ${border}`}
              >
                {update.status.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}