// src/pages/Explore.js
import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { FaPlay } from "react-icons/fa";
import PostModal from "../horizontal_tabs/PostModal";
import { useNavigate } from "react-router-dom";

// Fetch user info
const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        username: data.username || data.name || "Unknown",
        photoURL:
          data.profileImage?.startsWith("data:") ||
          data.profileImage?.startsWith("http")
            ? data.profileImage
            : data.profileImage
            ? `data:image/jpeg;base64,${data.profileImage}`
            : "/default-avatar.png",
      };
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
  }
  return { username: "Unknown", photoURL: "/default-avatar.png" };
};

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const userCache = useRef({});
  const navigate = useNavigate();

  // Fetch posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const enriched = await Promise.all(
        postDocs.map(async (post) => {
          if (post.userId) {
            if (!userCache.current[post.userId]) {
              userCache.current[post.userId] = await getUserData(post.userId);
            }
            return { ...post, user: userCache.current[post.userId] };
          }
          return {
            ...post,
            user: { username: "Unknown", photoURL: "/default-avatar.png" },
          };
        })
      );

      setPosts(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Search Bar */}
      <div className="px-4 py-3 sticky top-0 bg-white z-50 border-b flex justify-center">
        <input
          type="text"
          placeholder="Search"
          onFocus={() => navigate("/search")} // 🚀 Redirect to SearchPage
          className="w-full max-w-md text-sm px-4 py-2 rounded-full border border-gray-300 bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
          readOnly // Prevents typing here, redirects instead
        />
      </div>

      {/* Loading skeleton grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-px mt-1 max-w-5xl mx-auto animate-pulse">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200" />
          ))}
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          <div className="grid grid-cols-3 gap-px mt-1 sm:gap-1 max-w-5xl mx-auto">
            {posts.map((post) =>
              post.image ? (
                <div
                  key={post.id}
                  className="relative group cursor-pointer aspect-square overflow-hidden"
                  onClick={() => setSelectedPost(post)}
                >
                  {/* Post Thumbnail */}
                  <img
                    src={post.image}
                    alt={post.text || "Post"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Reel/Video Icon */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded-full">
                    <FaPlay className="text-white text-xs" />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 hidden group-hover:flex items-center justify-center gap-4 text-white font-semibold transition-opacity">
                    <div className="flex items-center gap-1 text-sm">
                      ❤️ {post.likes?.length || 0}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      💬 {post.comments?.length || 0}
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>

          {/* Modal */}
          <PostModal
            open={!!selectedPost}
            handleClose={() => setSelectedPost(null)}
            post={selectedPost}
          />
        </>
      )}
    </div>
  );
}