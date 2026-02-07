

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
  FaExclamationTriangle,
  FaUserTie,
  FaSpinner as FaProgress,
  FaCheckCircle,
} from "react-icons/fa";
import SuggestionsBar from "./Sugestionbar";
import { useNavigate } from "react-router-dom";
import geotagphoto from "../assets/geotagMapphoto.webp";
import ScrollNavbar from "./ScrollNavbar";
import verifyTick from "../assets/Blue_tick.png";

// ----------------- Safe Photo Resolver -----------------
const resolvePhotoURL = (val) => {
  if (typeof val !== "string" || !val.trim()) {
    return "/default-avatar.png";
  }
  if (val.startsWith("http") || val.startsWith("data:")) {
    return val;
  }
  return `data:image/jpeg;base64,${val}`;
};

// ----------------- User data helper -----------------
const getUserData = async (userId) => {
  if (!userId) {
    return {
      id: "unknown",
      username: "Unknown",
      photoURL: "/default-avatar.png",
      userRole: "user",
    };
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
        userRole: data.userRole || "user",
      };
    }
  } catch (err) {
    console.error("user fetch error:", err);
  }
  return {
    id: "unknown",
    username: "Unknown",
    photoURL: "/default-avatar.png",
    userRole: "user",
  };
};

// ----------------- Enhanced Status Badge Renderer -----------------
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return {
          icon: <FaExclamationTriangle className="w-3 h-3" />,
          text: "Pending",
          gradient: "from-red-400 via-red-500 to-red-600",
          textColor: "text-white",
          borderColor: "border-indigo-300",
          shadowColor: "shadow-indigo-500/30",
          pulseColor: "animate-pulse",
        };
      case "assign":
        return {
          icon: <FaUserTie className="w-3 h-3" />,
          text: "Assigned",
          gradient: "from-amber-400 via-black to-black",
          textColor: "text-black",
          borderColor: "border-yellow-300",
          shadowColor: "shadow-yellow-500/40",
          pulseColor: "",
        };
      case "at progress":
        return {
          icon: <FaProgress className="w-3 h-3 animate-spin" />,
          text: "In Progress",
          gradient: "from-blue-500 via-blue-600 to-indigo-600",
          textColor: "text-white",
          borderColor: "border-blue-300",
          shadowColor: "shadow-blue-500/40",
          pulseColor: "",
        };
      case "resolved":
        return {
          icon: <FaCheckCircle className="w-3 h-3" />,
          text: "Resolved",
          gradient: "from-emerald-500 via-green-600 to-green-700",
          textColor: "text-white",
          borderColor: "border-green-300",
          shadowColor: "shadow-green-500/40",
          pulseColor: "",
        };
      default:
        return {
          icon: <FaExclamationTriangle className="w-3 h-3" />,
          text: status || "Unknown",
          gradient: "from-gray-400 to-gray-500",
          textColor: "text-white",
          borderColor: "border-gray-300",
          shadowColor: "shadow-gray-500/30",
          pulseColor: "",
        };
    }
  };

  const config = getStatusConfig(status);
  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full 
        bg-gradient-to-r ${config.gradient} ${config.textColor} 
        ${config.borderColor} border ${config.shadowColor} shadow-md 
        backdrop-blur-sm ${config.pulseColor} transform transition-all 
        duration-300 hover:scale-105 hover:shadow-lg`}
    >
      {config.icon}
      <span className="text-[10px] font-semibold uppercase tracking-wide">
        {config.text}
      </span>
    </div>
  );
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 697);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("likes", JSON.stringify(likes));
  }, [likes]);

  const getCommentCount = (pid) => {
    const stored = localStorage.getItem(`comments_${pid}`);
    return stored ? JSON.parse(stored).length : 0;
  };

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

  const toggleLike = (pid) =>
    setLikes((prev) => ({ ...prev, [pid]: !prev[pid] }));

  const handleFollowToggle = async (userId) => {
    if (!currentUserId || !userId) return;
    setLoadingStates((prev) => ({ ...prev, [userId]: true }));

    const userRef = doc(db, "users", currentUserId);
    const theirUserRef = doc(db, "users", userId);
    const myFollowingDoc = doc(db, "users", currentUserId, "following", userId);
    const theirFollowersDoc = doc(
      db,
      "users",
      userId,
      "followers",
      currentUserId
    );
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

  if (!authChecked)
    return <p className="text-center py-6">Checking authentication...</p>;
  if (!currentUserId)
    return (
      <div className="text-center py-6">
        <p className="text-gray-600">🚀 Please log in to see posts.</p>
      </div>
    );
  if (loading) return <p className="text-center py-6">Loading feed...</p>;

  return (
    <>
      {isMobile && <ScrollNavbar />}

      <div className="max-w-lg mx-auto mt-6 space-y-6 min-h-screen rounded-xl p-3">
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
              className={`rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-gray-50 ${
                post.status?.toLowerCase() === "pending"
                  ? "ring-2 ring-gray-100 shadow-red-400/20"
                  : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-4 pt-3">
                <div className="flex items-center gap-3">
                  <img
                    src={avatar}
                    className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
                    alt={username}
                  />
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1">
                      {username}
                      {post.user?.userRole === "Department" && (
                        <img
                          src={verifyTick}
                          alt="verified"
                          className="w-4 h-4"
                          title="Verified Department"
                        />
                      )}
                    </p>
                    <p className="text-xs text-[#782048]">@{username}</p>
                    <p className="text-[10px] text-gray-500">
                      {formatDistanceToNow(
                        post.createdAt?.toDate?.() || new Date(),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                </div>

                {/* Follow Button */}
                {!isOwnPost && (
                  <button
                    onClick={() => handleFollowToggle(post.user?.id)}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm rounded-full font-bold transition ${
                      isFollowed
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-500 text-white"
                    }`}
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

              {/* Post Image + Geo + Caption */}
              {post.imageUrl && (
                <div className="relative mt-2 px-3 mb-5">
                  <div className="relative rounded-2xl overflow-hidden bg-gray-200 shadow-sm aspect-square sm:aspect-[4/3] flex justify-center items-center">
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />

                    {post.status && (
                      <div className="absolute top-3 right-3 z-10">
                        <StatusBadge status={post.status} />
                      </div>
                    )}

                    {post.geoData && (
                      <div className="absolute bottom-0 left-0 w-full bg-black/70 text-white text-xs sm:text-sm p-3 flex items-start gap-2 backdrop-blur-sm">
                        <div className="flex-shrink-0 w-13 h-13  md:w-23 md:h-23 bg-gray-300 overflow-hidden rounded-md ">
                          <img
                            src={geotagphoto}
                            alt="Map Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col gap-[2px] leading-tight">
                          <div className="flex items-center gap-1 font-semibold text-red-400">
                            <FaMapMarkerAlt className="inline-block" />
                            <span>
                              {post.geoData.country || "Unknown Country"}
                            </span>
                          </div>
                          {post.geoData.region && (
                            <span className="text-white/90">
                              {post.geoData.region}
                            </span>
                          )}
                          {post.geoData.city && (
                            <span className="text-white/80 italic">
                              {post.geoData.city}
                            </span>
                          )}
                          <span className="text-white/70">
                            Lat: {post.geoData.latitude?.toFixed(4)}, Lng:{" "}
                            {post.geoData.longitude?.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-2 mt-3">
                    {post.description && (
                      <p className="text-base sm:text-lg text-gray-700 font-semibold mb-1">
                        {post.description}
                      </p>
                    )}
                    {post.text && (
                      <p className="text-gray-600 text-sm">{post.text}</p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm"
                            onClick={() =>
                              navigate(`/explore/tags/${tag.replace("#", "")}`)
                            }
                          >
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-b-2xl text-gray-200">
                    <div className="flex gap-6 items-center text-sm">
                      <div
                        onClick={() => navigate(`/comments/${post.id}`)}
                        className="flex items-center gap-1 cursor-pointer hover:text-blue-400"
                      >
                        <FaComment />
                        <span>{getCommentCount(post.id)}</span>
                      </div>
                      <div
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center gap-1 cursor-pointer hover:text-red-400"
                      >
                        <FaHeart className={`${liked ? "text-red-500" : ""}`} />
                        <span>{liked ? 1 : 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-lg">
                      <FaPaperPlane className="cursor-pointer hover:text-green-400" />
                      
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