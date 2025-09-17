import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FaHeart } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md"; // ✅ Back arrow icon
import EmojiPicker from "emoji-picker-react";

// 🔁 Same Firestore resolver logic used in Profile
const getUserData = async (currentUser) => {
  try {
    const userId = currentUser.uid;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    const isGoogleUser = currentUser.providerData.some(
      (provider) => provider.providerId === "google.com"
    );

    const googleName = currentUser.displayName || "";
    const googlePhoto = currentUser.photoURL || "";

    let data = userSnap.exists() ? userSnap.data() : {};

    return {
      username: data.username || data.name || googleName || "Anonymous",
      name: data.name || googleName || "Anonymous",
      photoURL: (() => {
        if (isGoogleUser && googlePhoto) return googlePhoto;
        if (data.profileImage) {
          if (data.profileImage.startsWith("http")) return data.profileImage;
          if (data.profileImage.startsWith("data:")) return data.profileImage;
          return `data:image/jpeg;base64,${data.profileImage}`;
        }
        return "/default-avatar.png";
      })(),
    };
  } catch (err) {
    console.error("Error fetching user data:", err);
    return {
      username: "Anonymous",
      name: "Unknown",
      photoURL: "/default-avatar.png",
    };
  }
};

const CommentHomeFeed = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const auth = getAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);

  const commentsEndRef = useRef(null);

  // Fetch current user info
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const data = await getUserData(auth.currentUser);
      setCurrentUserData(data);
    };
    fetchUserData();
  }, [auth.currentUser]);

  // Load comments from localStorage
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const saved = localStorage.getItem(`comments_${postId}`);
      setComments(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }, 600);
  }, [postId]);

  // Auto scroll down when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Add a new comment
  const addComment = () => {
    if (!newComment.trim() || !currentUserData) return;
    const updated = [
      ...comments,
      {
        id: Date.now(),
        user: currentUserData.username,
        avatar: currentUserData.photoURL,
        text: newComment,
        ts: "Now",
        likes: 0,
      },
    ];
    setComments(updated);
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updated));
    setNewComment("");
  };

  // Toggle like
  const toggleLike = (id) => {
    const updated = comments.map((c) =>
      c.id === id ? { ...c, likes: c.likes ? 0 : 1 } : c
    );
    setComments(updated);
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updated));
  };

  // Emoji
  const handleEmojiClick = (emojiData) => {
    setNewComment((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Go back"
        >
          <MdArrowBack className="text-2xl text-black" />
        </button>
        <h2 className="text-lg font-semibold">Comments</h2>
      </div>

      {/* Scrollable Comments */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-36">
        {loading ? (
          <p className="text-gray-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-400 text-center">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <img
                src={c.avatar}
                alt={c.user}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">{c.user}</span>{" "}
                      <span>{c.text}</span>
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>{c.ts}</span>
                      <button className="hover:underline">Reply</button>
                      <button className="hover:underline">
                        See translation
                      </button>
                    </div>
                  </div>
                  <div
                    className="flex flex-col items-center cursor-pointer text-xs"
                    onClick={() => toggleLike(c.id)}
                  >
                    <FaHeart
                      className={`${
                        c.likes ? "text-red-500" : "text-gray-400"
                      }`}
                    />
                    <span>{c.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Fixed Input Bar – responsive */}
      {currentUserData && (
        <div className="fixed bottom-20 md:bottom-0 left-0 w-full flex gap-2 items-center border-t p-3 bg-white z-50">
          <img
            src={currentUserData.photoURL}
            alt="me"
            className="w-8 h-8 rounded-full object-cover"
          />
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 border-none outline-none text-sm bg-gray-100 px-3 py-2 rounded-full"
            placeholder="Add a comment..."
          />
          <button
            onClick={addComment}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full"
          >
            Post
          </button>
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-xl"
          >
            😀
          </button>
        </div>
      )}

      {/* Emoji Picker – responsive */}
      {showEmojiPicker && (
        <div className="fixed bottom-35 md:bottom-12 left-0 w-full bg-white border shadow-lg z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width="100%"
            height="300px"
            theme="light"
          />
        </div>
      )}
    </div>
  );
};

export default CommentHomeFeed;