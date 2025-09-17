import React from 'react';
import { FaMedal } from 'react-icons/fa';

const BADGE_COLORS = {
  bronze: {
    bg: 'bg-orange-300',
    text: 'text-orange-700',
    border: 'border-orange-400'
  },
  silver: {
    bg: 'bg-gray-300',
    text: 'text-gray-600',
    border: 'border-gray-400'
  },
  gold: {
    bg: 'bg-yellow-400',
    text: 'text-yellow-700',
    border: 'border-yellow-500'
  },
  platinum: {
    bg: 'bg-blue-200',
    text: 'text-blue-700',
    border: 'border-blue-300'
  },
  diamond: {
    bg: 'bg-purple-200',
    text: 'text-purple-700',
    border: 'border-purple-300'
  }
};

// Helper function to get badge info from user level
const getBadgeInfo = (level) => {
  if (level >= 13) return { type: 'diamond' };
  if (level >= 10) return { type: 'platinum', tier: level - 9 };
  if (level >= 7) return { type: 'gold', tier: level - 6 };
  if (level >= 4) return { type: 'silver', tier: level - 3 };
  return { type: 'bronze', tier: level };
};

export default function BadgeDisplay({ level, showDetails = false, className = '' }) {
  const badge = getBadgeInfo(level);
  const colors = BADGE_COLORS[badge.type];
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div 
        className={`
          ${colors.bg} ${colors.border}
          w-10 h-10 rounded-full border-2 shadow-md
          flex items-center justify-center
          transform transition-all duration-300 hover:scale-110
        `}
      >
        <FaMedal className={`text-lg ${colors.text}`} />
      </div>
      
      {showDetails && (
        <div className="flex flex-col">
          <span className={`font-semibold capitalize ${colors.text}`}>
            {badge.type} {badge.tier && `Tier ${badge.tier}`}
          </span>
          <span className="text-xs text-gray-500">
            Level {level}
          </span>
        </div>
      )}
    </div>
  );
}