// import React, { useEffect, useState, useRef } from "react";
// import { db } from "../firebase/firebase";
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   getDoc,
//   updateDoc,
//   arrayUnion,
//   arrayRemove,
//   setDoc,
//   getDocs,
//   serverTimestamp,
//   increment,
//   writeBatch,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { formatDistanceToNow } from "date-fns";
// import {
//   FaHeart,
//   FaComment,
//   FaPaperPlane,
//   FaBookmark,
//   FaSpinner,
//   FaMapMarkerAlt,
// } from "react-icons/fa";
// import SuggestionsBar from "./Sugestionbar";
// import { useNavigate } from "react-router-dom";
// import geotagphoto from "../assets/geotagMapphoto.webp";

// // ----------------- Safe Photo Resolver -----------------
// const resolvePhotoURL = (val) => {
//   if (typeof val !== "string" || !val.trim()) {
//     return "/default-avatar.png"; // fallback image
//   }
//   if (val.startsWith("http") || val.startsWith("data:")) {
//     return val;
//   }
//   return `data:image/jpeg;base64,${val}`;
// };

// // ----------------- User data helper -----------------
// const getUserData = async (userId) => {
//   if (!userId) {
//     return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
//   }
//   try {
//     const uRef = doc(db, "users", userId);
//     const snap = await getDoc(uRef);
//     if (snap.exists()) {
//       const data = snap.data();
//       return {
//         id: userId,
//         username: data.username || data.name || "Unknown",
//         photoURL: resolvePhotoURL(data.profileImage),
//       };
//     }
//   } catch (err) {
//     console.error("user fetch error:", err);
//   }
//   return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
// };

// // ----------------- Main PostList --------------------
// export default function PostList() {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [followingIds, setFollowingIds] = useState([]);
//   const [currentUserId, setCurrentUserId] = useState(null);

//   const userCache = useRef({});
//   const [likes, setLikes] = useState(() =>
//     JSON.parse(localStorage.getItem("likes") || "{}")
//   );
//   const [loadingStates, setLoadingStates] = useState({});

//   const navigate = useNavigate();

//   // persist likes
//   useEffect(() => {
//     localStorage.setItem("likes", JSON.stringify(likes));
//   }, [likes]);

//   const getCommentCount = (pid) => {
//     const stored = localStorage.getItem(`comments_${pid}`);
//     return stored ? JSON.parse(stored).length : 0;
//   };

//   // fetch following list
//   useEffect(() => {
//     const auth = getAuth();
//     const user = auth.currentUser;
//     if (!user) {
//       setFollowingIds([]);
//       setCurrentUserId(null);
//       setLoading(false);
//       return;
//     }
//     setCurrentUserId(user.uid);

//     const fetchFollowing = async () => {
//       const followingCol = collection(db, "users", user.uid, "following");
//       const snap = await getDocs(followingCol);
//       setFollowingIds(snap.docs.map((d) => d.id));
//     };

//     fetchFollowing();
//   }, []);

//   // fetch posts
//   useEffect(() => {
//     setLoading(true);

//     const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
//     const unsub = onSnapshot(q, async (snap) => {
//       const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

//       const enriched = await Promise.all(
//         docs.map(async (p) => {
//           const userId = p.userId || p.uid;
//           if (!userCache.current[userId]) {
//             userCache.current[userId] = await getUserData(userId);
//           }
//           return {
//             ...p,
//             user: userCache.current[userId],
//             imageUrl: p.imageUrl || p.image || null,
//             description: p.description || "",
//             tags: p.tags || [],
//           };
//         })
//       );

//       setPosts(enriched);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, []);

//   // toggles
//   const toggleLike = (pid) =>
//     setLikes((prev) => ({ ...prev, [pid]: !prev[pid] }));

//   // Follow/Unfollow handler
//   const handleFollowToggle = async (userId) => {
//     if (!currentUserId || !userId) return;

//     setLoadingStates((prev) => ({ ...prev, [userId]: true }));

//     const userRef = doc(db, "users", currentUserId);
//     const theirUserRef = doc(db, "users", userId);

//     const myFollowingDoc = doc(db, "users", currentUserId, "following", userId);
//     const theirFollowersDoc = doc(db, "users", userId, "followers", currentUserId);

//     const isFollowing = followingIds.includes(userId);

//     try {
//       if (isFollowing) {
//         // Unfollow
//         const batch = writeBatch(db);
//         batch.update(userRef, {
//           following: arrayRemove(userId),
//           followingCount: increment(-1),
//         });
//         batch.delete(myFollowingDoc);
//         batch.delete(theirFollowersDoc);
//         await batch.commit();

//         try {
//           await updateDoc(theirUserRef, { followersCount: increment(-1) });
//         } catch {
//           await setDoc(theirUserRef, { followersCount: 0 }, { merge: true });
//         }
//         setFollowingIds((prev) => prev.filter((id) => id !== userId));
//       } else {
//         // Follow
//         const batch = writeBatch(db);
//         batch.update(userRef, {
//           following: arrayUnion(userId),
//           followingCount: increment(1),
//         });
//         batch.set(myFollowingDoc, { followedAt: serverTimestamp() });
//         batch.set(theirFollowersDoc, { followedAt: serverTimestamp() });
//         await batch.commit();

//         try {
//           await updateDoc(theirUserRef, { followersCount: increment(1) });
//         } catch {
//           await setDoc(theirUserRef, { followersCount: 1 }, { merge: true });
//         }
//         setFollowingIds((prev) => [...prev, userId]);
//       }
//     } catch (error) {
//       console.error("Error updating follow/unfollow:", error);
//     } finally {
//       setLoadingStates((prev) => ({ ...prev, [userId]: false }));
//     }
//   };

//   if (loading) return <p className="text-center py-6">Loading feed...</p>;

//   // ------------------
//   // Render
//   // ------------------
//   return (
//     <div className="max-w-full md:w-md mx-auto mt-6 space-y-8">
//       <SuggestionsBar />

//       {posts.map((post) => {
//         const liked = likes[post.id] || false;
//         const isFollowed = followingIds.includes(post.user?.id);
//         const isLoading = loadingStates[post.user?.id] || false;
//         const avatar = post.user?.photoURL || "/default-avatar.png";
//         const username = post.user?.username || "Unknown";
//         const isOwnPost = post.user?.id === currentUserId;

//         return (
//           <div
//             key={post.id}
//             className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden"
//           >
//             {/* Header */}
//             <div className="flex items-center justify-between p-4">
//               <div className="flex items-center gap-3">
//                 <img
//                   src={avatar}
//                   className="w-10 h-10 rounded-full border object-cover"
//                   alt={username}
//                 />
//                 <div>
//                   <p className="text-[15px] font-medium leading-none mb-1">
//                     {username}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {formatDistanceToNow(
//                       post.createdAt?.toDate?.() || new Date(),
//                       { addSuffix: true }
//                     )}
//                   </p>
//                 </div>
//               </div>

//               {!isOwnPost && (
//                 <button
//                   onClick={() => handleFollowToggle(post.user?.id)}
//                   disabled={isLoading}
//                   className={`
//                     relative px-4 py-1.5 text-sm font-medium rounded
//                     transition-all duration-200 ease-in-out
//                     disabled:opacity-50 disabled:cursor-not-allowed
//                     ${
//                       isFollowed
//                         ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
//                         : "bg-blue-500 text-white border border-blue-500 hover:bg-blue-600"
//                     }
//                   `}
//                 >
//                   {isLoading ? (
//                     <FaSpinner className="animate-spin inline w-4 h-4" />
//                   ) : isFollowed ? (
//                     "Following"
//                   ) : (
//                     "Follow"
//                   )}
//                 </button>
//               )}
//             </div>

//             {/* Post Image with Floating Geo Tag Card */}
//             {post.imageUrl && (
//               <div className="relative">
//                 <img
//                   src={post.imageUrl}
//                   className="w-full aspect-[4/3] object-cover"
//                   alt=""
//                 />

//                 {post.geoData && (
//                   <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4/5 bg-black/80 text-white rounded-lg overflow-hidden shadow-md flex">
//                     <div className="w-20 h-16 flex-shrink-0 overflow-hidden">
//                       <img
//                         src={geotagphoto}
//                         alt="Map Preview"
//                         className="w-full h-full object-cover scale-110"
//                       />
//                     </div>
//                     <div className="flex flex-col justify-center px-3 py-2 text-xs">
//                       <p className="font-semibold">{post.geoData.country || "Unknown"}</p>
//                       <p className="text-gray-300">
//                         {post.geoData.city}, {post.geoData.region}
//                       </p>
//                       <p className="text-gray-400 text-[11px]">
//                         Lat: {post.geoData.latitude.toFixed(4)}, Lng:{" "}
//                         {post.geoData.longitude.toFixed(4)}
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Actions */}
//             <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
//               <div className="flex gap-4 text-xl text-gray-700">
//                 <div className="flex items-center gap-1.5">
//                   <FaHeart
//                     onClick={() => toggleLike(post.id)}
//                     className={`cursor-pointer transform hover:scale-110 transition-transform ${
//                       liked ? "text-red-500" : "hover:text-red-400"
//                     }`}
//                   />
//                   <span className="text-sm font-medium">{liked ? 1 : 0}</span>
//                 </div>
//                 <div
//                   onClick={() => navigate(`/comments/${post.id}`)}
//                   className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer"
//                 >
//                   <FaComment />
//                   <span className="text-sm font-medium">
//                     {getCommentCount(post.id)}
//                   </span>
//                 </div>
//                 <FaPaperPlane className="hover:text-green-500 cursor-pointer transform hover:scale-110 transition-transform" />
//               </div>
//               <FaBookmark className="cursor-pointer hover:text-yellow-500 transform hover:scale-110 transition-transform" />
//             </div>

//             {/* Caption, Description & Tags */}
//             <div className="px-4 pb-4">
//               {/* Caption (Username + Text) */}
//               {post.text && (
//                 <p className="text-sm mb-1">
//                   <span className="font-semibold mr-2">{username}</span>
//                   {post.text}
//                 </p>
//               )}

//               {/* Description */}
//               {post.description && (
//                 <p className="text-sm text-gray-600 leading-snug mb-1">
//                   {post.description}
//                 </p>
//               )}

//               {/* Inline Tags */}
//               {post.tags && post.tags.length > 0 && (
//                 <p className="text-sm text-blue-600 flex flex-wrap gap-x-2 gap-y-1 mb-1">
//                   {post.tags.map((tag, index) => (
//                     <span
//                       key={index}
//                       className="hover:text-blue-800 cursor-pointer"
//                       onClick={() =>
//                         navigate(`/explore/tags/${tag.replace("#", "")}`)
//                       }
//                     >
//                       {tag.startsWith("#") ? tag : `#${tag}`}
//                     </span>
//                   ))}
//                 </p>
//               )}

//               {/* Location */}
//               {post.geoData && (
//                 <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
//                   <FaMapMarkerAlt className="w-3 h-3" />
//                   <span>
//                     {post.geoData.address ||
//                       `${post.geoData.city}, ${post.geoData.country}`}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }



import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDocs,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { formatDistanceToNow } from "date-fns";
import {
  FaHeart,
  FaComment,
  FaPaperPlane,
  FaBookmark,
  FaSpinner,
  FaMapMarkerAlt,
} from "react-icons/fa";
import SuggestionsBar from "./Sugestionbar";
import { useNavigate } from "react-router-dom";
import geotagphoto from "../assets/geotagMapphoto.webp";

// ----------------- Safe Photo Resolver -----------------
const resolvePhotoURL = (val) => {
  if (typeof val !== "string" || !val.trim()) {
    return "/default-avatar.png"; // fallback image
  }
  if (val.startsWith("http") || val.startsWith("data:")) {
    return val;
  }
  return `data:image/jpeg;base64,${val}`;
};

// ----------------- User data helper -----------------
const getUserData = async (userId) => {
  if (!userId) {
    return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
  }
  try {
    const uRef = doc(db, "users", userId);
    const snap = await getDoc(uRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: userId,
        username: data.username || data.name || "Unknown",
        photoURL: resolvePhotoURL(data.profileImage),
      };
    }
  } catch (err) {
    console.error("user fetch error:", err);
  }
  return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
};

// ----------------- Main PostList --------------------
export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // NEW FLAG

  const userCache = useRef({});
  const [likes, setLikes] = useState(() =>
    JSON.parse(localStorage.getItem("likes") || "{}")
  );
  const [loadingStates, setLoadingStates] = useState({});

  const navigate = useNavigate();
  const auth = getAuth();

  // persist likes
  useEffect(() => {
    localStorage.setItem("likes", JSON.stringify(likes));
  }, [likes]);

  const getCommentCount = (pid) => {
    const stored = localStorage.getItem(`comments_${pid}`);
    return stored ? JSON.parse(stored).length : 0;
  };

  // ✅ AUTH STATE LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [auth]);

  // fetch following list
  useEffect(() => {
    if (!currentUserId) {
      setFollowingIds([]);
      return;
    }

    const fetchFollowing = async () => {
      const followingCol = collection(db, "users", currentUserId, "following");
      const snap = await getDocs(followingCol);
      setFollowingIds(snap.docs.map((d) => d.id));
    };

    fetchFollowing();
  }, [currentUserId]);

  // fetch posts
  useEffect(() => {
    if (!currentUserId) return; // 🚀 Dont fetch if not logged in
    setLoading(true);

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const enriched = await Promise.all(
        docs.map(async (p) => {
          const userId = p.userId || p.uid;
          if (!userCache.current[userId]) {
            userCache.current[userId] = await getUserData(userId);
          }
          return {
            ...p,
            user: userCache.current[userId],
            imageUrl: p.imageUrl || p.image || null,
            description: p.description || "",
            tags: p.tags || [],
          };
        })
      );

      setPosts(enriched);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUserId]);

  // toggles
  const toggleLike = (pid) =>
    setLikes((prev) => ({ ...prev, [pid]: !prev[pid] }));

  // Follow/Unfollow handler
  const handleFollowToggle = async (userId) => {
    if (!currentUserId || !userId) return;

    setLoadingStates((prev) => ({ ...prev, [userId]: true }));

    const userRef = doc(db, "users", currentUserId);
    const theirUserRef = doc(db, "users", userId);

    const myFollowingDoc = doc(db, "users", currentUserId, "following", userId);
    const theirFollowersDoc = doc(db, "users", userId, "followers", currentUserId);

    const isFollowing = followingIds.includes(userId);

    try {
      if (isFollowing) {
        // Unfollow
        const batch = writeBatch(db);
        batch.update(userRef, {
          following: arrayRemove(userId),
          followingCount: increment(-1),
        });
        batch.delete(myFollowingDoc);
        batch.delete(theirFollowersDoc);
        await batch.commit();

        try {
          await updateDoc(theirUserRef, { followersCount: increment(-1) });
        } catch {
          await setDoc(theirUserRef, { followersCount: 0 }, { merge: true });
        }
        setFollowingIds((prev) => prev.filter((id) => id !== userId));
      } else {
        // Follow
        const batch = writeBatch(db);
        batch.update(userRef, {
          following: arrayUnion(userId),
          followingCount: increment(1),
        });
        batch.set(myFollowingDoc, { followedAt: serverTimestamp() });
        batch.set(theirFollowersDoc, { followedAt: serverTimestamp() });
        await batch.commit();

        try {
          await updateDoc(theirUserRef, { followersCount: increment(1) });
        } catch {
          await setDoc(theirUserRef, { followersCount: 1 }, { merge: true });
        }
        setFollowingIds((prev) => [...prev, userId]);
      }
    } catch (error) {
      console.error("Error updating follow/unfollow:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // AUTH GUARD SCREEN
  if (!authChecked) {
    return <p className="text-center py-6">Checking authentication...</p>;
  }

  if (!currentUserId) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-600">🚀 Please log in to see posts.</p>
       
      </div>
    );
  }

  if (loading) return <p className="text-center py-6">Loading feed...</p>;

  // ------------------
  // Render
  // ------------------
  return (
    <div className="max-w-full md:w-md mx-auto mt-6 space-y-8">
      <SuggestionsBar />

      {posts.map((post) => {
        const liked = likes[post.id] || false;
        const isFollowed = followingIds.includes(post.user?.id);
        const isLoading = loadingStates[post.user?.id] || false;
        const avatar = post.user?.photoURL || "/default-avatar.png";
        const username = post.user?.username || "Unknown";
        const isOwnPost = post.user?.id === currentUserId;

        return (
          <div
            key={post.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  className="w-10 h-10 rounded-full border object-cover"
                  alt={username}
                />
                <div>
                  <p className="text-[15px] font-medium leading-none mb-1">
                    {username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(
                      post.createdAt?.toDate?.() || new Date(),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              </div>

              {!isOwnPost && (
                <button
                  onClick={() => handleFollowToggle(post.user?.id)}
                  disabled={isLoading}
                  className={`
                    relative px-4 py-1.5 text-sm font-medium rounded
                    transition-all duration-200 ease-in-out
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isFollowed
                        ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                        : "bg-blue-500 text-white border border-blue-500 hover:bg-blue-600"
                    }
                  `}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin inline w-4 h-4" />
                  ) : isFollowed ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </button>
              )}
            </div>

            {/* Post Image with Floating Geo Tag Card */}
            {post.imageUrl && (
              <div className="relative">
                <img
                  src={post.imageUrl}
                  className="w-full aspect-[4/3] object-cover"
                  alt=""
                />

                {post.geoData && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4/5 bg-black/80 text-white rounded-lg overflow-hidden shadow-md flex">
                    <div className="w-20 h-16 flex-shrink-0 overflow-hidden">
                      <img
                        src={geotagphoto}
                        alt="Map Preview"
                        className="w-full h-full object-cover scale-110"
                      />
                    </div>
                    <div className="flex flex-col justify-center px-3 py-2 text-xs">
                      <p className="font-semibold">{post.geoData.country || "Unknown"}</p>
                      <p className="text-gray-300">
                        {post.geoData.city}, {post.geoData.region}
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Lat: {post.geoData.latitude.toFixed(4)}, Lng:{" "}
                        {post.geoData.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="flex gap-4 text-xl text-gray-700">
                <div className="flex items-center gap-1.5">
                  <FaHeart
                    onClick={() => toggleLike(post.id)}
                    className={`cursor-pointer transform hover:scale-110 transition-transform ${
                      liked ? "text-red-500" : "hover:text-red-400"
                    }`}
                  />
                  <span className="text-sm font-medium">{liked ? 1 : 0}</span>
                </div>
                <div
                  onClick={() => navigate(`/comments/${post.id}`)}
                  className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer"
                >
                  <FaComment />
                  <span className="text-sm font-medium">
                    {getCommentCount(post.id)}
                  </span>
                </div>
                <FaPaperPlane className="hover:text-green-500 cursor-pointer transform hover:scale-110 transition-transform" />
              </div>
              <FaBookmark className="cursor-pointer hover:text-yellow-500 transform hover:scale-110 transition-transform" />
            </div>

            {/* Caption, Description & Tags */}
            <div className="px-4 pb-4">
              {/* Caption (Username + Text) */}
              {post.text && (
                <p className="text-sm mb-1">
                  <span className="font-semibold mr-2">{username}</span>
                  {post.text}
                </p>
              )}

              {/* Description */}
              {post.description && (
                <p className="text-sm text-gray-600 leading-snug mb-1">
                  {post.description}
                </p>
              )}

              {/* Inline Tags */}
              {post.tags && post.tags.length > 0 && (
                <p className="text-sm text-blue-600 flex flex-wrap gap-x-2 gap-y-1 mb-1">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="hover:text-blue-800 cursor-pointer"
                      onClick={() =>
                        navigate(`/explore/tags/${tag.replace("#", "")}`)
                      }
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </p>
              )}

              {/* Location */}
              {post.geoData && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <FaMapMarkerAlt className="w-3 h-3" />
                  <span>
                    {post.geoData.address ||
                      `${post.geoData.city}, ${post.geoData.country}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}