import React from 'react';
import { WhatshotIcon } from '@mui/icons-material/Whatshot';
import { motion } from 'framer-motion';
import BadgeDisplay from './BadgeDisplay';

export default function StickCard({ stickData }) {
  if (!stickData) return null;

  const {
    currentStreak,
    longestStreak,
    points,
    level,
    currentPostPoints,
    lastStickDate
  } = stickData;

  const progress = (points % 100) / 100;
  const lastPostDate = lastStickDate ? new Date(lastStickDate) : null;
  const today = new Date();
  const isToday = lastPostDate?.toDateString() === today.toDateString();

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mx-2">
      {/* Header with Badge & Level */}
      <div className="flex items-center justify-between mb-4">
        <BadgeDisplay level={level} showDetails={true} />
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Points</div>
          <div className="text-2xl font-bold">{points}</div>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div className="absolute inset-0 flex justify-center items-center text-xs font-semibold">
          Level {level} • {Math.floor(progress * 100)}%
        </div>
      </div>

      {/* Streaks Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            {currentStreak}
            <WhatshotIcon sx={{ color: 'orange' }} />
          </div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>

        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            {longestStreak}
            <WhatshotIcon sx={{ color: 'orange' }} />
          </div>
          <div className="text-sm text-gray-600">Best Streak</div>
        </div>
      </div>

      {/* Today's Points */}
      {isToday && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3 bg-green-50 rounded-lg"
        >
          <div className="text-lg text-green-600">
            +{currentPostPoints} points today!
          </div>
          <div className="text-sm text-gray-500">
            Keep posting to maintain your streak
          </div>
        </motion.div>
      )}

      {/* Call to Action */}
      {!isToday && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3 bg-red-50 rounded-lg"
        >
          <div className="text-lg text-red-600">
            Don't break your streak!
          </div>
          <div className="text-sm text-gray-500">
            Post today to earn +{currentPostPoints} points
          </div>
        </motion.div>
      )}
    </div>
  );
}