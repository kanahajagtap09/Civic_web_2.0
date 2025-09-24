import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Helper to get user data
const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const {
        username = data.name || "Unknown",
        profileImage = "",
        displayName = "",
      } = data;

      return {
        username,
        displayName,
        photoURL:
          profileImage && (profileImage.startsWith("data:") || profileImage.startsWith("http"))
            ? profileImage
            : profileImage
            ? `data:image/jpeg;base64,${profileImage}`
            : "",
      };
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
  }
  return {
    username: "Unknown",
    displayName: "",
    photoURL: "",
  };
};

export default function Followers() {
  const [users, setUsers] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
  const [firestoreFollowersCount, setFirestoreFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchFollowers = async () => {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setUsers([]);
        setFollowerIds([]);
        setFirestoreFollowersCount(0);
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch followers list
        const followersRef = collection(db, "users", currentUser.uid, "followers");
        const followersSnapshot = await getDocs(followersRef);
        const ids = followersSnapshot.docs.map((doc) => doc.id);

        // 2. Fetch user data for each follower
        const usersData = await Promise.all(
          ids.map(async (uid) => {
            const user = await getUserData(uid);
            return { id: uid, ...user };
          })
        );

        // 3. Fetch followers count from Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let firestoreCount = 0;
        if (userDocSnap.exists()) {
          firestoreCount = userDocSnap.data().followersCount || 0;
        }

        setUsers(usersData);
        setFollowerIds(ids);
        setFirestoreFollowersCount(firestoreCount);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  // Remove follower - only remove from your followers list
  const handleRemoveFollower = async (uid) => {
    setUpdating((prev) => ({ ...prev, [uid]: true }));
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const myFollowersDoc = doc(db, "users", currentUser.uid, "followers", uid);

      // Only delete from your followers collection (you have permission for this)
      await deleteDoc(myFollowersDoc);
      
      // Update only your followers count
      await updateDoc(userDocRef, { followersCount: increment(-1) });

      // Note: We cannot delete from their following collection due to permissions
      // They will need to unfollow manually or you need to update your Firestore rules

      // Update local state
      setFollowerIds((prev) => prev.filter((id) => id !== uid));
      setFirestoreFollowersCount((prev) => Math.max(0, prev - 1));
      setUsers((prev) => prev.filter((user) => user.id !== uid));
      
    } catch (err) {
      console.error("Failed to remove follower:", err);
      alert("Failed to remove follower. Try again.");
    } finally {
      setUpdating((prev) => ({ ...prev, [uid]: false }));
    }
  };

  // Search filter
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto mt-23 md:mt-4 bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="font-bold text-lg">Followers</div>
        <div className="text-gray-500 text-sm">{firestoreFollowersCount} Followers</div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-400">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <ul>
          {[...Array(6)].map((_, i) => (
            <li key={i} className="flex items-center px-4 py-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="ml-4 flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
              <div className="ml-4 px-5 py-2 rounded-full bg-gray-200 w-20 h-8" />
            </li>
          ))}
        </ul>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          {search ? "No followers found matching your search." : "No followers yet."}
        </div>
      ) : (
        <ul>
          {filteredUsers.map((user) => {
            const isLoading = updating[user.id];
            return (
              <li
                key={user.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 transition rounded-lg"
              >
                <img
                  src={user.photoURL || "https://placehold.co/40x40"}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover border border-gray-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <div className="ml-4 flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{user.username}</div>
                  <div className="text-sm text-gray-500 truncate">{user.displayName}</div>
                </div>

                <button
                  className={`ml-4 px-4 py-1 text-sm rounded font-semibold border transition min-w-[90px]
                    ${isLoading
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  disabled={isLoading}
                  onClick={() => handleRemoveFollower(user.id)}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 border-t-2 border-b-2 border-current rounded-full animate-spin mr-1"></div>
                      Removing...
                    </div>
                  ) : (
                    "Remove"
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}