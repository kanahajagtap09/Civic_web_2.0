import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
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

export default function Following() {
  const [users, setUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [firestoreFollowingCount, setFirestoreFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsersAndFollowing = async () => {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setUsers([]);
        setFollowingIds([]);
        setFirestoreFollowingCount(0);
        setLoading(false);
        return;
      }

      // 1. Fetch following list
      const followingRef = collection(db, "users", currentUser.uid, "following");
      const followingSnapshot = await getDocs(followingRef);
      const ids = followingSnapshot.docs.map((doc) => doc.id);

      // 2. Fetch user data for each following
      const usersData = await Promise.all(
        ids.map(async (uid) => {
          const user = await getUserData(uid);
          return { id: uid, ...user };
        })
      );

      // 3. Fetch followingCount from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let firestoreCount = 0;
      if (userDocSnap.exists()) {
        firestoreCount = userDocSnap.data().followingCount || 0;
      }

      setUsers(usersData);
      setFollowingIds(ids);
      setFirestoreFollowingCount(firestoreCount);
      setLoading(false);
    };

    fetchUsersAndFollowing();
  }, []);

  // Toggle follow/unfollow
  const handleToggleFollow = async (uid) => {
    setUpdating((prev) => ({ ...prev, [uid]: true })); // set per-user loading
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const isFollowing = followingIds.includes(uid);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const theirUserRef = doc(db, "users", uid);

      const myFollowingDoc = doc(db, "users", currentUser.uid, "following", uid);
      const theirFollowersDoc = doc(db, "users", uid, "followers", currentUser.uid);

      if (isFollowing) {
        // --- Unfollow ---
        await deleteDoc(myFollowingDoc);
        await deleteDoc(theirFollowersDoc);
        await updateDoc(userDocRef, { followingCount: increment(-1) });
        await updateDoc(theirUserRef, { followersCount: increment(-1) });

        setFollowingIds((prev) => prev.filter((id) => id !== uid));
        setFirestoreFollowingCount((prev) => prev - 1);
      } else {
        // --- Follow ---
        await setDoc(myFollowingDoc, { followedAt: serverTimestamp() });
        await setDoc(theirFollowersDoc, { followedAt: serverTimestamp() });
        await updateDoc(userDocRef, { followingCount: increment(1) });
        await updateDoc(theirUserRef, { followersCount: increment(1) });

        setFollowingIds((prev) => [...prev, uid]);
        setFirestoreFollowingCount((prev) => prev + 1);
      }
    } catch (err) {
      alert("Failed to update. Try again.");
    } finally {
      setUpdating((prev) => ({ ...prev, [uid]: false })); // clear loading
    }
  };

  // Search filter
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto mt-23 md:mt-4  bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="font-bold text-lg">Following</div>
        <div className="text-gray-500 text-sm">{firestoreFollowingCount} Following</div>
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
        <div className="text-center py-6 text-gray-500">You are not following anyone.</div>
      ) : (
        <ul>
          {filteredUsers.map((user) => {
            const isFollowing = followingIds.includes(user.id);
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
                    ${isFollowing
                      ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      : "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"}
                    ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isLoading}
                  onClick={() => handleToggleFollow(user.id)}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 border-t-2 border-b-2 border-current rounded-full animate-spin mr-1"></div>
                      loading...
                    </div>
                  ) : (
                    isFollowing ? "Following" : "Follow"
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