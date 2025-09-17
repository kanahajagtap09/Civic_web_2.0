import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const INITIAL_POST_POINTS = 3;
const MAX_POST_POINTS = 10;

const getBadgeType = (level) => {
  if (level >= 13) return 'diamond';
  if (level >= 10) return `platinum-${level - 9}`;
  if (level >= 7) return `gold-${level - 6}`;
  if (level >= 4) return `silver-${level - 3}`;
  return `bronze-${level}`;
};

const dateToString = (date) => date.toISOString().split('T')[0];

export const updateUserSticksOnPost = async (uid) => {
  try {
    const today = new Date();
    const todayStr = dateToString(today);
    const sticksRef = doc(db, 'userSticks', uid);
    
    // Get current data
    const sticksDoc = await getDoc(sticksRef);
    
    if (!sticksDoc.exists()) {
      // First post ever - create initial streak document
      const initialData = {
        uid,
        points: INITIAL_POST_POINTS,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastStickDate: todayStr,
        streakDays: [todayStr],
        badge: 'bronze-1',
        currentPostPoints: INITIAL_POST_POINTS
      };
      
      await setDoc(sticksRef, initialData);
      return initialData;
    }
    
    const data = sticksDoc.data();
    const lastDate = data.lastStickDate ? new Date(data.lastStickDate) : null;
    let updates = {};
    
    // Check if this is a same-day post
    if (lastDate && dateToString(lastDate) === todayStr) {
      // Add same points again for multiple posts in a day
      updates = {
        points: data.points + data.currentPostPoints
      };
    } else {
      // New day post - check streak continuation
      const streakContinues = lastDate && 
        Math.abs(today - lastDate) <= 24 * 60 * 60 * 1000;
      
      let newStreak;
      let newPoints;
      let newPostPoints;
      
      if (streakContinues) {
        // Streak continues - increase points reward
        newStreak = data.currentStreak + 1;
        newPostPoints = Math.min(
          data.currentPostPoints + 1, 
          MAX_POST_POINTS
        );
      } else {
        // Streak broken - reset
        newStreak = 1;
        newPostPoints = INITIAL_POST_POINTS;
      }
      
      newPoints = data.points + newPostPoints;
      
      updates = {
        points: newPoints,
        level: Math.floor(newPoints / 100) + 1,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, data.longestStreak),
        lastStickDate: todayStr,
        streakDays: [...data.streakDays, todayStr],
        currentPostPoints: newPostPoints,
      };
      
      // Update badge if level changed
      const newLevel = Math.floor(newPoints / 100) + 1;
      if (newLevel !== data.level) {
        updates.badge = getBadgeType(newLevel);
      }
    }
    
    // Apply updates
    await updateDoc(sticksRef, updates);
    return { ...data, ...updates };
    
  } catch (error) {
    console.error('Error updating user sticks:', error);
    throw error;
  }
};

// Get user sticks data (one-time fetch)
export const getUserSticks = async (uid) => {
  try {
    const sticksRef = doc(db, 'userSticks', uid);
    const sticksDoc = await getDoc(sticksRef);
    return sticksDoc.exists() ? sticksDoc.data() : null;
  } catch (error) {
    console.error('Error getting user sticks:', error);
    throw error;
  }
};