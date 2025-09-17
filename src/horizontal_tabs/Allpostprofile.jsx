import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  writeBatch,
  increment,
} from "firebase/firestore";
import PostModal from "./PostModal";
import { FiMoreVertical } from "react-icons/fi";

// Fetch extra user data (username, profile image)
const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const { username = data.name || "Unknown", profileImage = "" } = data;

      return {
        username,
        photoURL:
          profileImage.startsWith("data:") || profileImage.startsWith("http")
            ? profileImage
            : profileImage
            ? `data:image/jpeg;base64,${profileImage}`
            : "/default-avatar.png",
      };
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
  }

  return {
    username: "Unknown",
    photoURL: "/default-avatar.png",
  };
};

export default function Allpostprofile() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userCache = useRef({});
  const [userId, setUserId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  // Track logged‑in user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      else {
        setUserId(null);
        setPosts([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch logged‑in user's posts
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    const q = query(
      collection(db, "posts"),
      where("uid", "==", userId),      // ✅ field now matches creator
      orderBy("createdAt", "desc")    // ✅ sorted by time
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Attach cached user info
      const enriched = await Promise.all(
        docs.map(async (post) => {
          if (!userCache.current[userId]) {
            userCache.current[userId] = await getUserData(userId);
          }
          return {
            ...post,
            user: userCache.current[userId],
          };
        })
      );

      setPosts(enriched);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  // Delete Post
  const handleDelete = async (postId) => {
    try {
      const batch = writeBatch(db);

      const postRef = doc(db, "posts", postId);
      batch.delete(postRef);

      const userRef = doc(db, "users", userId);
      batch.update(userRef, { postCount: increment(-1) });

      await batch.commit();

      console.log("Deleted post:", postId);
      setMenuOpen(null);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // UI: Loading
  if (loading) {
    return (
      <p className="text-center py-6 text-gray-500">Loading your posts...</p>
    );
  }

  // UI: Empty state
  if (!posts.length) {
    return (
      <p className="text-center py-6 text-gray-500">
        You have not posted anything yet.
      </p>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-3 gap-1"
        style={{ maxWidth: 400, margin: "0 auto" }}
      >
        {posts.map((post) => (
          <div key={post.id} className="relative group">
            {/* Post image */}
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.description || "Post image"}
                className="w-full h-32 object-cover cursor-pointer"
                style={{ borderRadius: 4 }}
                onClick={() => setSelectedPost(post)}
              />
            )}

            {/* Post menu button */}
            <div className="absolute top-1 right-1">
              <button
                className="p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === post.id ? null : post.id);
                }}
              >
                <FiMoreVertical size={18} />
              </button>

              {/* Dropdown menu */}
              {menuOpen === post.id && (
                <div className="absolute right-0 mt-2 w-28 bg-white shadow-lg rounded-md overflow-hidden z-20">
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setMenuOpen(null)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal viewer */}
      <PostModal
        open={!!selectedPost}
        handleClose={() => setSelectedPost(null)}
        post={selectedPost}
      />
    </>
  );
}