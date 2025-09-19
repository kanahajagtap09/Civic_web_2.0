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
import { useNavigate } from "react-router-dom";

// ✅ Safe resolver
const resolvePhotoURL = (val) => {
  if (typeof val !== "string" || !val.trim()) return "/default-avatar.png";
  if (val.startsWith("http") || val.startsWith("data:")) return val;
  return `data:image/jpeg;base64,${val}`;
};

// ✅ User data fetch
const getUserData = async (userId) => {
  if (!userId) return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
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
    console.error("error fetching user:", err);
  }
  return { id: "unknown", username: "Unknown", photoURL: "/default-avatar.png" };
};

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 697);
  const userCache = useRef({});
  const navigate = useNavigate();

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 697);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Fetch posts with enriched data
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
      {/* Container with proper padding for navbars */}
      <div className={`w-full ${isMobile ? 'pt-20 pb-24' : 'pt-24 pb-8'}`}>
        
        {/* Search Bar - Centered like nav */}
        <div className="px-4 py-3 sticky top-16 sm:top-20 bg-white z-40 border-b">
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search"
              onFocus={() => navigate("/search")}
              className="w-full text-sm px-4 py-2 rounded-full border border-gray-300 bg-gray-100 
                focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
              readOnly
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="max-w-5xl mx-auto px-1">
            <div className="grid grid-cols-3 gap-px animate-pulse">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Posts grid */}
            <div className="max-w-5xl mx-auto px-1">
              <div className="grid grid-cols-3 gap-px sm:gap-1">
                {posts.map((post) =>
                  post.imageUrl ? (
                    <div
                      key={post.id}
                      className="relative group cursor-pointer aspect-square overflow-hidden bg-gray-100"
                      onClick={() => setSelectedPost(post)}
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.description || "Post"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Video icon if needed */}
                      {post.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded-full">
                          <FaPlay className="text-white text-xs" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 
                        transition-all duration-300 flex items-center justify-center gap-4 
                        text-white font-semibold opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-1 text-sm">
                          <span>❤️</span>
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span>💬</span>
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Empty state */}
            {posts.filter(p => p.imageUrl).length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">No posts to explore yet</p>
              </div>
            )}

            {/* Modal */}
            <PostModal
              open={!!selectedPost}
              handleClose={() => setSelectedPost(null)}
              post={selectedPost}
            />
          </>
        )}
      </div>
    </div>
  );
}