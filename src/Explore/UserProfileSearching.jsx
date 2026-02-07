// ---------- UserProfileSearching.jsx ----------
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import {
  FaArrowLeft,
  FaEnvelope,
  FaHeart,
  FaRegComment,
  FaPlay,
} from "react-icons/fa";
import verifyTick from "../assets/Blue_tick.png";
import PostModal from "../horizontal_tabs/PostModal";

// ---------- helper to fetch simple user meta ----------
const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const { username = data.name || "Unknown", profileImage = "" } = data;
      return {
        username,
        photoURL:
          profileImage?.startsWith("data:") || profileImage?.startsWith("http")
            ? profileImage
            : profileImage
            ? `data:image/jpeg;base64,${profileImage}`
            : "/default-avatar.png",
      };
    }
  } catch (err) {
    console.error("getUserData error:", err);
  }
  return { username: "Unknown", photoURL: "/default-avatar.png" };
};

// ---------------------------------
export default function UserProfileSearching() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [sticks, setSticks] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  const userCache = useRef({});

  // ---------- Auth ----------
  useEffect(() => {
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
    const unsub = auth.onAuthStateChanged((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // ---------- Basic user + sticks data ----------
  useEffect(() => {
    if (!id) return;
    const unsubUser = onSnapshot(doc(db, "users", id), (snap) => {
      setUser(snap.exists() ? { uid: id, ...snap.data() } : null);
      setLoading(false);
    });
    const unsubSticks = onSnapshot(doc(db, "userSticks", id), (snap) => {
      if (snap.exists()) setSticks(snap.data());
      else
        setSticks({
          level: 0,
          points: 0,
          badge: "None",
          currentStreak: 0,
          longestStreak: 0,
        });
    });
    return () => {
      unsubUser();
      unsubSticks();
    };
  }, [id]);

  // ---------- Follow state ----------
  useEffect(() => {
    if (!currentUser || !id || currentUser.uid === id) return;
    const ref = doc(db, "users", id, "followers", currentUser.uid);
    const unsub = onSnapshot(ref, (s) => setIsFollowing(s.exists()));
    return () => unsub();
  }, [currentUser, id]);

  // ---------- Follow / Unfollow ----------
  const toggleFollow = async () => {
    if (!currentUser || currentUser.uid === id) return;
    setBtnLoading(true);
    const me = doc(db, "users", currentUser.uid);
    const them = doc(db, "users", id);
    const myFollow = doc(db, "users", currentUser.uid, "following", id);
    const theirFollower = doc(db, "users", id, "followers", currentUser.uid);

    try {
      if (isFollowing) {
        await Promise.all([
          updateDoc(me, {
            following: arrayRemove(id),
            followingCount: increment(-1),
          }),
          updateDoc(them, { followersCount: increment(-1) }),
          deleteDoc(myFollow),
          deleteDoc(theirFollower),
        ]);
      } else {
        await Promise.all([
          updateDoc(me, {
            following: arrayUnion(id),
            followingCount: increment(1),
          }),
          updateDoc(them, { followersCount: increment(1) }),
          setDoc(myFollow, { followedAt: serverTimestamp() }),
          setDoc(theirFollower, { followedAt: serverTimestamp() }),
        ]);
      }
    } catch (e) {
      console.error("Follow error:", e);
    } finally {
      setBtnLoading(false);
    }
  };

  // ---------- Posts listener (uses stored numeric counts) ----------
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "posts"),
      where("uid", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          likesCount: data.likesCount || 0,
          commentsCount: data.commentsCount || 0,
        };
      });

      const enriched = await Promise.all(
        docs.map(async (p) => {
          if (!userCache.current[id])
            userCache.current[id] = await getUserData(id);
          return { ...p, user: userCache.current[id] };
        })
      );

      setPosts(enriched);
    });

    return unsub;
  }, [id]);

  // ---------- Animate progress ----------
  useEffect(() => {
    if (!sticks) return;
    let i = 0;
    const target = Math.min(100, sticks.points % 100);
    const step = () => {
      i += 3;
      setProgress(Math.min(i, target));
      if (i < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [sticks]);

  if (loading || !user || !sticks)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );

  // ---------- Reusable grid tile ----------
  const GridTile = ({ post }) => (
    <div
      className="relative group cursor-pointer overflow-hidden"
      onClick={() => setSelectedPost(post)}
    >
      <img
        src={
          post.imageUrl || post.imageBase64 || "/default-avatar.png"
        }
        alt={post.description || "post"}
        className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {post.type === "video" && (
        <FaPlay className="absolute top-2 right-2 text-white text-xs opacity-80" />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 text-white flex items-center justify-center gap-6 transition-opacity">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <FaHeart className="text-lg" />
          <span>{post.likesCount}</span>
        </div>
        <div
          className="flex items-center gap-1 text-sm font-semibold hover:text-blue-400"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/comments/${post.id}`);
          }}
        >
          <FaRegComment className="text-lg" />
          <span>{post.commentsCount}</span>
        </div>
      </div>
    </div>
  );

  // ---------- Main return ----------
  return (
    <div className="min-h-screen bg-white text-black">
      {/* MOBILE */}
      <div className="md:hidden bg-blue-500 pt-[90px] rounded-t-3xl flex flex-col items-center">
        <div className="w-full h-56 flex items-center justify-between px-6">
          <FaArrowLeft
            className="text-white text-xl cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <FaEnvelope className="text-white text-xl cursor-pointer" />
        </div>

        <div className="relative w-full max-w-sm -mt-24 bg-white rounded-3xl shadow-md flex flex-col items-center px-6 pt-20 pb-10">
          <img
            src={user.profileImage || "/default-avatar.png"}
            alt="avatar"
            className="w-28 h-28 rounded-full border-4 border-white -mt-14 object-cover"
          />
          <h2 className="mt-4 font-bold text-gray-900">@{user.username}</h2>

          {/* Stats */}
          <div className="flex gap-8 mt-3 text-center">
            <div>
              <div className="text-lg font-semibold">{posts.length}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {user.followersCount || 0}
              </div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {user.followingCount || 0}
              </div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
          </div>

          {/* Follow */}
          {currentUser && currentUser.uid !== id && (
            <button
              onClick={toggleFollow}
              disabled={btnLoading}
              className={`mt-4 px-5 py-2 rounded-xl text-sm font-semibold ${
                isFollowing
                  ? "bg-gray-100 border border-gray-300"
                  : "bg-blue-500 text-white"
              }`}
            >
              {btnLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}

          {/* Posts grid */}
          <div className="w-full mt-6 border-t pt-4">
            {posts.length === 0 ? (
              <p className="text-center text-gray-400">No posts yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-[2px]">
                {posts.map((p) => (
                  <GridTile key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex flex-col items-center pt-24">
        <div className="max-w-5xl w-full flex gap-10 pb-10 border-b border-gray-200">
          <div className="w-64 flex justify-center">
            <img
              src={user.profileImage || "/default-avatar.png"}
              alt="avatar"
              className="w-40 h-40 rounded-full object-cover"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-semibold">@{user.username}</h2>
              {user.userRole === "Department" && (
                <img src={verifyTick} alt="verified" className="w-5 h-5" />
              )}
              {currentUser && currentUser.uid !== id && (
                <button
                  onClick={toggleFollow}
                  disabled={btnLoading}
                  className={`px-4 py-[6px] rounded-md text-sm ${
                    isFollowing
                      ? "bg-gray-100 border border-gray-300"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {btnLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            <div className="flex gap-6 mb-3 text-sm">
              <span>
                <b>{posts.length}</b> posts
              </span>
              <span>
                <b>{user.followersCount || 0}</b> followers
              </span>
              <span>
                <b>{user.followingCount || 0}</b> following
              </span>
            </div>
            <div className="font-semibold text-sm">{user.name}</div>
          </div>
        </div>

        {/* Posts grid */}
        <div className="max-w-5xl w-full mt-10">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((p) => (
                <GridTile key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <PostModal
        open={!!selectedPost}
        handleClose={() => setSelectedPost(null)}
        post={selectedPost}
      />
    </div>
  );
}