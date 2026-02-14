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
import PostModal from "../Explore/ExploreModel/Postmodel";
import PostList from "./PostList";

// ✅ Safe resolver
const resolvePhotoURL = (val) => {
  if (typeof val !== "string" || !val.trim()) return "/default-avatar.png";
  if (val.startsWith("http") || val.startsWith("data:")) return val;
  return `data:image/jpeg;base64,${val}`;
};

// ✅ User data fetch
const getUserData = async (userId) => {
  if (!userId)
    return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: userId,
        username: data.username || data.name || "Unknown",
        photoURL: resolvePhotoURL(data.profileImage),
      };
    }
  } catch (err) {
    console.error("Error fetching user:", err);
  }
  return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
};

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [mobileFeedPosts, setMobileFeedPosts] = useState(null); // New state for mobile feed
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Updated breakpoint
  const userCache = useRef({});

  // Check screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); // Updated breakpoint
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Fetch posts
  useEffect(() => {
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
            description: p.description || p.text || "",
            tags: p.tags || [],
            geoData: p.geoData || null,
          };
        })
      );
      setPosts(enriched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className={`w-full ${isMobile ? "pt-20 pb-24" : "pt-24 pb-8"}`}>


        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : mobileFeedPosts ? (
          // --- Mobile Feed View using PostList ---
          <div className="pb-20">
            <PostList posts={mobileFeedPosts} />
          </div>
        ) : (
          // --- Grid View (Original) ---
          <div className="max-w-5xl mx-auto px-1">
            <div className="grid grid-cols-3 gap-px sm:gap-1">
              {posts.map((post) =>
                post.imageUrl ? (
                  <div
                    key={post.id}
                    className="relative group cursor-pointer aspect-square overflow-hidden bg-gray-100"
                    onClick={() => {
                      if (isMobile) {
                        const index = posts.findIndex(p => p.id === post.id);
                        const reorderedPosts = [...posts.slice(index), ...posts.slice(0, index)];
                        setMobileFeedPosts(reorderedPosts);
                      } else {
                        setSelectedPost(post);
                      }
                    }}
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.description || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white text-lg font-bold">
                      <div className="flex items-center gap-2">
                        <span>❤️</span> {post.likes?.length || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💬</span> {post.comments?.length || 0}
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>

            {posts.filter((p) => p.imageUrl).length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">No posts to explore yet</p>
              </div>
            )}
          </div>
        )}

        {/* Post Modal (Desktop & Mobile Comments if needed) */}
        <PostModal
          open={!!selectedPost}
          handleClose={() => setSelectedPost(null)}
          post={selectedPost}
          posts={posts}
          onPostChange={setSelectedPost}
        />
      </div>
    </div>
  );
}