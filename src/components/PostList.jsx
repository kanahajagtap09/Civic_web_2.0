// src/components/PostList.jsx (or wherever your PostList is located)
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
import ScrollNavbar from "./ScrollNavbar"; // Add this import

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
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 697);

  const userCache = useRef({});
  const [likes, setLikes] = useState(() =>
    JSON.parse(localStorage.getItem("likes") || "{}")
  );
  const [loadingStates, setLoadingStates] = useState({});

  const navigate = useNavigate();
  const auth = getAuth();

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 697);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist likes
  useEffect(() => {
    localStorage.setItem("likes", JSON.stringify(likes));
  }, [likes]);

  const getCommentCount = (pid) => {
    const stored = localStorage.getItem(`comments_${pid}`);
    return stored ? JSON.parse(stored).length : 0;
  };

  // Auth listener
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

  // Fetch following list
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

  // Fetch posts
  useEffect(() => {
    if (!currentUserId) return;
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

  // Like toggle
  const toggleLike = (pid) =>
    setLikes((prev) => ({ ...prev, [pid]: !prev[pid] }));

  // Follow/Unfollow
  const handleFollowToggle = async (userId) => {
    if (!currentUserId || !userId) return;

    setLoadingStates((prev) => ({ ...prev, [userId]: true }));
    const userRef = doc(db, "users", currentUserId);
    const theirUserRef = doc(db, "users", userId);
    const myFollowingDoc = doc(db, "users", currentUserId, "following", userId);
    const theirFollowersDoc = doc(db, "users", userId, "followers", currentUserId);
    const isFollowing = followingIds.includes(userId);

    try {
      const batch = writeBatch(db);
      if (isFollowing) {
        batch.update(userRef, {
          following: arrayRemove(userId),
          followingCount: increment(-1),
        });
        batch.delete(myFollowingDoc);
        batch.delete(theirFollowersDoc);
        await batch.commit();
        await updateDoc(theirUserRef, { followersCount: increment(-1) }).catch(() =>
          setDoc(theirUserRef, { followersCount: 0 }, { merge: true })
        );
        setFollowingIds((prev) => prev.filter((id) => id !== userId));
      } else {
        batch.update(userRef, {
          following: arrayUnion(userId),
          followingCount: increment(1),
        });
        batch.set(myFollowingDoc, { followedAt: serverTimestamp() });
        batch.set(theirFollowersDoc, { followedAt: serverTimestamp() });
        await batch.commit();
        await updateDoc(theirUserRef, { followersCount: increment(1) }).catch(() =>
          setDoc(theirUserRef, { followersCount: 1 }, { merge: true })
        );
        setFollowingIds((prev) => [...prev, userId]);
      }
    } catch (error) {
      console.error("Error updating follow/unfollow:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Guard
  if (!authChecked) return <p className="text-center py-6">Checking authentication...</p>;
  if (!currentUserId) return <div className="text-center py-6"><p className="text-gray-600">🚀 Please log in to see posts.</p></div>;
  if (loading) return <p className="text-center py-6">Loading feed...</p>;

  return (
    <>
      {/* Add ScrollNavbar for mobile */}
      {isMobile && <ScrollNavbar />}
      
      <div className="max-w-lg mx-auto mt-6 space-y-6">
        {/* Mark the SuggestionsBar as the first section */}
        <div id="first-section">
          <SuggestionsBar />
        </div>

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
              className="rounded-3xl overflow-hidden bg-[#eaf0ff] shadow-md border border-gray-200 "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-3">
                  <img
                    src={avatar}
                    className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
                    alt={username}
                  />
                  <div>
                    <p className="font-semibold text-sm">{username}</p>
                    <p className="text-xs text-[#782048]">@{username}</p>
                    <p className="text-[10px] text-gray-500">
                      {formatDistanceToNow(post.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {!isOwnPost && (
                  <button
                    onClick={() => handleFollowToggle(post.user?.id)}
                    disabled={isLoading}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      isFollowed
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin inline w-3 h-3" />
                    ) : isFollowed ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </button>
                )}
              </div>

              {/* Image + Caption + ActionBar */}
              {post.imageUrl && (
                <div className="relative  px-3 mt-2 mb-5">
                  <div className="rounded-4xl overflow-hidden bg-transparent ">
                    {/* Photo */}
                    <img
                      src={post.imageUrl}
                      className=" w-full max-h-[380px]  object-cover rounded-4xl"
                      alt=""
                    />

                    {/* GeoTag stays same */}
                    {post.geoData && (
                      <div className="absolute bottom-25 left-1/2 -translate-x-1/2 w-[90%] sm:w-4/5 
                                        text-white 
                                      rounded-xl shadow-lg flex overflow-hidden ">
                        <div className="w-24 sm:w-28 h-25 bg-transparent sm:h-24 flex-shrink-0 overflow-hidden">
                          <img src={geotagphoto} alt="Map Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className=" bg-black/80 text-white flex flex-col justify-center px-3 py-2 flex-1 text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                                                 <FaMapMarkerAlt className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                            <p className="font-semibold ">
                              {post.geoData.country || "Unknown Country"}
                            </p>
                          </div>
                          {post.geoData.region && <p className=" text-[11px] sm:text-xs">{post.geoData.region}</p>}
                          {post.geoData.city && <p className=" text-[11px] sm:text-xs">{post.geoData.city}</p>}
                          {post.geoData.address && <p className=" text-[10px] sm:text-xs italic mt-1">{post.geoData.address}</p>}
                          <p className="text-[10px] sm:text-[11px]  mt-1">
                            🌐 Lat: {post.geoData.latitude?.toFixed(4)}, Lng: {post.geoData.longitude?.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Caption/Description + Tags under photo */}
                    <div className="px-2 ">
                      {post.description && (
                        <p className="text-2xl font-bold text-gray-600">{post.description}</p>
                      )}
                      {post.text && (
                        <p className="text-sm text-gray-600 ">{post.text}</p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <p className="text-sm text-blue-600 flex flex-wrap gap-2 mb-1">
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
                    </div>

                    {/* Action Bar same width */}
                    <div className="flex items-center justify-between bg-gray-600 px-4 py-2">
                      <div className="flex gap-6 text-gray-300   text-lg">
                        <div
                          onClick={() => navigate(`/comments/${post.id}`)}
                          className="flex items-center gap-1 cursor-pointer hover:text-blue-300"
                        >
                          <FaComment />
                          <span className="text-sm">{getCommentCount(post.id)}</span>
                        </div>
                        <div
                          onClick={() => toggleLike(post.id)}
                          className="flex items-center gap-1 cursor-pointer hover:text-red-300"
                        >
                          <FaHeart className={`${liked ? "text-red-500" : ""}`} />
                          <span className="text-sm">{liked ? 1 : 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-lg text-gray-300">
                        <FaPaperPlane className="cursor-pointer hover:text-green-500" />
                        <FaBookmark className="cursor-pointer hover:text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}