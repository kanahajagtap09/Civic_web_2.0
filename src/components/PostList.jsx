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

/* ---------------- Resolve ----------------- */
const resolvePhotoURL = (val) => {
  if (typeof val !== "string" || !val.trim()) return "/default-avatar.png";
  if (val.startsWith("http") || val.startsWith("data:")) return val;
  return `data:image/jpeg;base64,${val}`;
};

/* ---------------- getUserData ---------------- */
const getUserData = async (userId) => {
  if (!userId) return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
  try {
    const uRef = doc(db, "users", userId);
    const snap = await getDoc(uRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        id: userId,
        username: d.username || d.name || "Unknown",
        photoURL: resolvePhotoURL(d.profileImage),
        userRole: d.userRole || "user",
      };
    }
  } catch (err) {
    console.error("user fetch error:", err);
  }
  return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
};

/* ---------------- Status Badge ---------------- */
const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase();
  const base = {
    pending: { text: "Pending", gradient: "from-red-500 to-red-700", icon: <FaExclamationTriangle className="w-3 h-3" /> },
    assign: { text: "Assigned", gradient: "from-amber-400 to-yellow-600", icon: <FaUserTie className="w-3 h-3" /> },
    "at progress": { text: "In Progress", gradient: "from-blue-500 to-indigo-600", icon: <FaProgress className="w-3 h-3 animate-spin" /> },
    resolved: { text: "Resolved", gradient: "from-green-500 to-emerald-700", icon: <FaCheckCircle className="w-3 h-3" /> },
  }[s] || { text: status || "Unknown", gradient: "from-gray-400 to-gray-500", icon: <FaExclamationTriangle className="w-3 h-3" /> };

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${base.gradient} text-white text-[10px] font-semibold`}>
      {base.icon}
      {base.text}
    </div>
  );
};

/* ---------------- Main ---------------- */
export default function PostList({ posts: propPosts }) {
  const [fetchedPosts, setFetchedPosts] = useState([]);
  const [loading, setLoading] = useState(!propPosts);
  const [followingIds, setFollowingIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const posts = propPosts || fetchedPosts;
  const userCache = useRef({});
  const [loadingStates, setLoadingStates] = useState({});
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUserId(u ? u.uid : null);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!currentUserId) return setFollowingIds([]);
    (async () => {
      const snap = await getDocs(collection(db, "users", currentUserId, "following"));
      setFollowingIds(snap.docs.map((d) => d.id));
    })();
  }, [currentUserId]);

  useEffect(() => {
    if (propPosts) {
      setLoading(false);
      return;
    }
    if (!currentUserId) return;
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filled = await Promise.all(
        docs.map(async (p) => {
          const uid = p.userId || p.uid;
          if (!userCache.current[uid]) userCache.current[uid] = await getUserData(uid);
          return { ...p, user: userCache.current[uid], imageUrl: p.imageUrl || p.image || null };
        })
      );
      setFetchedPosts(filled);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUserId, propPosts]);

  const toggleLike = async (post) => {
    if (!currentUserId) return;
    const ref = doc(db, "posts", post.id);
    const liked = post.likes?.includes(currentUserId);
    try {
      if (liked) await updateDoc(ref, { likes: arrayRemove(currentUserId) });
      else await updateDoc(ref, { likes: arrayUnion(currentUserId) });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowToggle = async (uid) => {
    if (!currentUserId || !uid) return;
    setLoadingStates((p) => ({ ...p, [uid]: true }));

    const mine = doc(db, "users", currentUserId);
    const them = doc(db, "users", uid);
    const myF = doc(db, "users", currentUserId, "following", uid);
    const theirF = doc(db, "users", uid, "followers", currentUserId);
    const isF = followingIds.includes(uid);

    try {
      const batch = writeBatch(db);
      if (isF) {
        batch.update(mine, { following: arrayRemove(uid), followingCount: increment(-1) });
        batch.delete(myF);
        batch.delete(theirF);
        await batch.commit();
        await updateDoc(them, { followersCount: increment(-1) });
        setFollowingIds((p) => p.filter((i) => i !== uid));
      } else {
        batch.update(mine, { following: arrayUnion(uid), followingCount: increment(1) });
        batch.set(myF, { followedAt: serverTimestamp() });
        batch.set(theirF, { followedAt: serverTimestamp() });
        await batch.commit();
        await updateDoc(them, { followersCount: increment(1) });
        setFollowingIds((p) => [...p, uid]);
      }
    } finally {
      setLoadingStates((p) => ({ ...p, [uid]: false }));
    }
  };

  if (!authChecked) return <p className="text-center py-6">Checking authentication…</p>;
  if (!currentUserId)
    return <div className="text-center py-6 text-gray-600">🚀 Please log in to see posts.</div>;
  if (loading) return <p className="text-center py-6">Loading feed…</p>;

  return (
    <>
      {isMobile && !propPosts && <ScrollNavbar />}

      <div
        className={`${isMobile ? "w-full mt-0 p-0" : "max-w-lg mx-auto mt-6 p-3 rounded-xl"} min-h-screen ${isMobile ? "" : "space-y-6"
          }`}
      >
        {!propPosts && (
          <div id="first-section">
            <SuggestionsBar />
          </div>
        )}

        {posts.map((post) => {
          const liked = post.likes?.includes(currentUserId);
          const followed = followingIds.includes(post.user?.id);
          const loadF = loadingStates[post.user?.id];
          const avatar = post.user?.photoURL;
          const username = post.user?.username || "Unknown";
          const own = post.user?.id === currentUserId;

          return (
            <div
              key={post.id}
              className={`${isMobile
                ? "border-b border-gray-100 bg-white mb-10"
                : "rounded-3xl shadow-lg border border-gray-200 bg-white"
                } overflow-hidden`}
            >
              {/* ----- Header ----- */}
              <div className="flex items-start justify-between px-4 pt-3">
                <div className="flex items-center gap-3">
                  <img
                    src={avatar}
                    alt={username}
                    className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1">
                      {username}
                      {post.user?.userRole === "Department" && (
                        <img src={verifyTick} alt="verified" className="w-4 h-4" />
                      )}
                    </p>
                    <p className="text-xs text-[#782048]">@{username}</p>
                    <p className="text-[10px] text-gray-500">
                      {formatDistanceToNow(post.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {!own && (
                  <button
                    onClick={() => handleFollowToggle(post.user?.id)}
                    disabled={loadF}
                    className={`px-4 py-1.5 text-sm rounded-full font-semibold transition ${followed ? "bg-gray-200 text-gray-700" : "bg-blue-500 text-white"
                      }`}
                  >
                    {loadF ? <FaSpinner className="animate-spin w-4 h-4" /> : followed ? "Following" : "Follow"}
                  </button>
                )}
              </div>

              {/* ----- Image + Status ----- */}
              {post.imageUrl && (
                <div className={`${isMobile ? "mt-0" : "mt-2 px-3"} relative`}>
                  <div className="relative overflow-hidden bg-gray-200 aspect-square sm:aspect-[4/3]">
                    <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                    {post.status && (
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={post.status} />
                      </div>
                    )}
                  </div>

                  {/* ----- GEO SECTION ----- */}
                  {post.geoData && (
                    <div className="flex items-start bg-[#2c2c2c] text-white rounded-xl -mt-2 overflow-hidden shadow-md">
                      <div className="w-24 sm:w-28 h-20 sm:h-24 flex-shrink-0">
                        <img
                          src={geotagphoto}
                          alt="Map Preview"
                          className="w-full h-full  mt-2.5 object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-center px-3 py-2 text-xs sm:text-sm leading-tight">
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                          <p className="font-semibold text-white">
                            {post.geoData.country || "Unknown Country"}
                          </p>
                        </div>
                        {post.geoData.region && (
                          <p className="text-gray-300">{post.geoData.region}</p>
                        )}
                        {post.geoData.city && (
                          <p className="italic text-gray-400">{post.geoData.city}</p>
                        )}
                        {post.geoData.address && (
                          <p className="text-[11px] italic text-gray-400">
                            {post.geoData.address}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          Lat: {post.geoData.latitude?.toFixed(4)}, Lng:{" "}
                          {post.geoData.longitude?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ----- Description ----- */}
              <div className="px-4 mt-4">
                {post.description && (
                  <p className="text-base text-gray-800 font-semibold mb-1">{post.description}</p>
                )}
                {post.text && <p className="text-gray-600 text-sm">{post.text}</p>}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm"
                        onClick={() => navigate(`/explore/tags/${tag.replace("#", "")}`)}
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ----- Action Bar ----- */}
              <div className="flex items-center justify-between bg-white border-t border-gray-100 px-4 py-3 mt-auto text-gray-600">
                <div className="flex gap-6 items-center text-lg">
                  <div
                    onClick={() => navigate(`/comments/${post.id}`)}
                    className="flex items-center gap-1 cursor-pointer hover:text-blue-500"
                  >
                    <FaComment />
                    <span className="text-sm font-semibold">
                      {post.commentsCount || post.comments?.length || 0}
                    </span>
                  </div>
                  <div
                    onClick={() => toggleLike(post)}
                    className="flex items-center gap-1 cursor-pointer hover:text-red-500"
                  >
                    {liked ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaHeart className="text-gray-400" />
                    )}
                    <span className="text-sm font-semibold">
                      {post.likes?.length || 0}
                    </span>
                  </div>
                </div>
                <FaPaperPlane className="cursor-pointer hover:text-green-500" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}