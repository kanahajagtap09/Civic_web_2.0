// src/horizontal_tabs/PostModal.js
import React, { useState, useEffect } from "react";
import { Modal, Box } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import {
  FaHeart,
  FaComment,
  FaPaperPlane,
  FaBookmark,
  FaSpinner,
  FaMapMarkerAlt,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import geotagphoto from "../../assets/geotagMapphoto.webp";

const PostModal = ({ open, handleClose, post }) => {
  const [liked, setLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  if (!post) return null;

  const isOwnPost = post.user?.id === currentUserId;

  const handleFollowToggle = async () => {
    setLoading(true);
    // Add your follow/unfollow logic here
    setTimeout(() => {
      setIsFollowing(!isFollowing);
      setLoading(false);
    }, 500);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    borderRadius: '24px',
    boxShadow: 24,
    p: 0,
    overflow: 'hidden',
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="post-modal"
      aria-describedby="post-modal-description"
    >
      <Box sx={modalStyle}>
        <div className="relative max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <FaTimes />
          </button>

          {/* Post content matching PostList UI */}
          <div className="bg-[#eaf0ff]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.user?.photoURL || "/default-avatar.png"}
                  className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
                  alt={post.user?.username || "User"}
                />
                <div>
                  <p className="font-semibold text-sm">{post.user?.username || "Unknown"}</p>
                  <p className="text-xs text-[#782048]">@{post.user?.username || "unknown"}</p>
                  <p className="text-[10px] text-gray-500">
                    {formatDistanceToNow(post.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {!isOwnPost && currentUserId && (
                <button
                  onClick={handleFollowToggle}
                  disabled={loading}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    isFollowing
                      ? "bg-gray-200 text-gray-700"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {loading ? (
                    <FaSpinner className="animate-spin inline w-3 h-3" />
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </button>
              )}
            </div>

            {/* Image + Caption + ActionBar */}
            <div className="px-3 mt-2 mb-5">
              <div className="rounded-4xl overflow-hidden bg-transparent">
                {/* Photo */}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    className="w-full max-h-[400px] object-cover rounded-4xl"
                    alt={post.description || "Post"}
                  />
                )}

                {/* GeoTag */}
                {post.geoData && (
                  <div className="relative -mt-20 mx-auto w-[90%] sm:w-4/5 
                    text-white rounded-xl shadow-lg flex overflow-hidden z-10">
                    <div className="w-24 sm:w-28 h-20 sm:h-24 flex-shrink-0 overflow-hidden">
                      <img src={geotagphoto} alt="Map Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-black/80 text-white flex flex-col justify-center px-3 py-2 flex-1 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                        <p className="font-semibold">
                          {post.geoData.country || "Unknown Country"}
                        </p>
                      </div>
                      {post.geoData.region && <p className="text-[11px] sm:text-xs">{post.geoData.region}</p>}
                      {post.geoData.city && <p className="text-[11px] sm:text-xs">{post.geoData.city}</p>}
                      {post.geoData.address && <p className="text-[10px] sm:text-xs italic mt-1">{post.geoData.address}</p>}
                      <p className="text-[10px] sm:text-[11px] mt-1">
                        🌐 Lat: {post.geoData.latitude?.toFixed(4)}, Lng: {post.geoData.longitude?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Caption/Description + Tags */}
                <div className="px-2 mt-4">
                  {post.description && (
                    <p className="text-xl font-bold text-gray-600">{post.description}</p>
                  )}
                  {post.text && (
                    <p className="text-sm text-gray-600">{post.text}</p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <p className="text-sm text-blue-600 flex flex-wrap gap-2 mt-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="hover:text-blue-800 cursor-pointer"
                          onClick={() => {
                            handleClose();
                            navigate(`/explore/tags/${tag.replace("#", "")}`);
                          }}
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between bg-gray-600 px-4 py-2 mt-3">
                  <div className="flex gap-6 text-gray-300 text-lg">
                    <div
                      onClick={() => {
                        handleClose();
                        navigate(`/comments/${post.id}`);
                      }}
                      className="flex items-center gap-1 cursor-pointer hover:text-blue-300"
                    >
                      <FaComment />
                      <span className="text-sm">{post.comments?.length || 0}</span>
                    </div>
                    <div
                      onClick={() => setLiked(!liked)}
                      className="flex items-center gap-1 cursor-pointer hover:text-red-300"
                    >
                                            <FaHeart className={`${liked ? "text-red-500" : ""}`} />
                      <span className="text-sm">{post.likes?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-lg text-gray-300">
                    <FaPaperPlane className="cursor-pointer hover:text-green-500" />
                    <FaBookmark className="cursor-pointer hover:text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default PostModal;