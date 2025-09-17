import React, { useState, useEffect } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import { FiMoreVertical, FiMapPin } from "react-icons/fi";
import { FaHeart, FaComment, FaPaperPlane, FaBookmark } from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, writeBatch, increment } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  width: { xs: "95vw", sm: 400 },
  maxHeight: "90vh",
  outline: "none",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export default function PostModal({ open, handleClose, post }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) setCurrentUserId(u.uid);
    });
    return () => unsub();
  }, []);

  if (!post) return null;

  const handleDelete = async () => {
    try {
      const batch = writeBatch(db);

      // Delete the post
      const postRef = doc(db, "posts", post.id);
      batch.delete(postRef);

      // Decrement user's post count (use uid!)
      const userRef = doc(db, "users", post.uid);
      batch.update(userRef, {
        postCount: increment(-1),
      });

      await batch.commit();

      console.log("Deleted post:", post.id);
      setMenuOpen(false);
      handleClose();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.user?.photoURL || "/default-avatar.png"}
              alt={post.user?.username}
              sx={{ width: 36, height: 36 }}
            />
            <div>
              <p className="text-[15px] font-medium leading-none">
                {post.user?.username || "Unknown"}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(post.createdAt?.toDate?.() || new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {currentUserId === post.uid && (
              <div>
                <IconButton size="small" onClick={() => setMenuOpen(!menuOpen)}>
                  <FiMoreVertical />
                </IconButton>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-md z-50">
                    <button
                      onClick={handleDelete}
                      className="block w-full text-red-600 px-3 py-1.5 text-sm hover:bg-red-50 text-left"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-3 py-1.5 text-sm hover:bg-gray-50 text-left"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        {/* Image */}
        <div className="relative bg-black flex justify-center items-center">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full max-h-[400px] object-contain bg-black"
            />
          )}
          {post.geoData && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-md">
              <FiMapPin className="w-4 h-4" />
              <div>
                <p className="text-xs font-medium leading-tight">
                  {post.geoData.address}
                </p>
                <p className="text-[10px] text-white/75">
                  📍 {post.geoData.latitude?.toFixed(3)},{" "}
                  {post.geoData.longitude?.toFixed(3)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3 flex flex-col gap-2 overflow-y-auto">
          {/* Actions */}
          <div className="flex items-center justify-between text-xl text-gray-700">
            <div className="flex gap-4">
              <FaHeart className="cursor-pointer hover:text-red-500" />
              <FaComment className="cursor-pointer hover:text-blue-500" />
              <FaPaperPlane className="cursor-pointer hover:text-green-500" />
            </div>
            <FaBookmark className="cursor-pointer hover:text-yellow-500" />
          </div>

          {/* Caption */}
          <div className="text-sm">
            <span className="font-semibold mr-2">
              {post.user?.username || "Unknown"}
            </span>
            {post.description}
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Box>
    </Modal>
  );
}