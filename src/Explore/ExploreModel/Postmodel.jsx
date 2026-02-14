import React, { useState, useEffect, useRef } from "react";
import { Modal, Box, Menu, MenuItem } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaPaperPlane,
  FaBookmark,
  FaRegBookmark,
  FaSpinner,
  FaMapMarkerAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSmile,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import EmojiPicker from "emoji-picker-react";
import geotagphoto from "../../assets/geotagMapphoto.webp";

const PostModal = ({ open, handleClose, post, posts = [], onPostChange }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

  // Refs for scrolling to bottom of comments
  const commentsEndRef = useRef(null);

  // Initialize state from post
  useEffect(() => {
    if (post) {
      setLiked(post.likes?.includes(currentUserId) || false);
      setLikesCount(post.likes?.length || 0);
      checkFollowStatus();
    }
  }, [post, currentUserId]);

  // Fetch Comments
  useEffect(() => {
    if (!post?.id) return;

    const q = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(comms);
    });

    return () => unsubscribe();
  }, [post?.id]);

  const checkFollowStatus = async () => {
    if (!post?.user?.id || !currentUserId) return;

    try {
      const docRef = doc(db, "users", currentUserId, "following", post.user.id);
      const docSnap = await getDoc(docRef);
      setIsFollowing(docSnap.exists());
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) return;

    // Optimistic UI update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    const postRef = doc(db, "posts", post.id);
    try {
      if (newLiked) {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserId)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserId)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert if error
      setLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !post.user?.id) return;
    setLoading(true);

    const targetUserId = post.user.id;
    const currentUserRef = doc(db, "users", currentUserId, "following", targetUserId);
    const targetUserRef = doc(db, "users", targetUserId, "followers", currentUserId);

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(currentUserRef);
        await deleteDoc(targetUserRef);
        setIsFollowing(false);
      } else {
        // Follow
        await setDoc(currentUserRef, { timestamp: serverTimestamp() });
        await setDoc(targetUserRef, { timestamp: serverTimestamp() });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUserId) return;

    const text = commentText;
    setCommentText(""); // Clear input immediately
    setShowEmojiPicker(false);

    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: text,
        userId: currentUserId,
        username: currentUser.displayName || "User",
        photoURL: currentUser.photoURL || "/default-avatar.png",
        createdAt: serverTimestamp(),
      });

      // Update comment count on post
      await updateDoc(doc(db, "posts", post.id), {
        commentsCount: increment(1)
      });

      // Scroll to bottom
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentText(text); // Revert on error
    }
  };

  const onEmojiClick = (emojiData) => {
    setCommentText(prev => prev + emojiData.emoji);
  };

  if (!post) return null;

  const isOwnPost = post.user?.id === currentUserId;

  // Find index for navigation
  const currentIndex = posts.findIndex((p) => p.id === post.id);
  const hasNext = currentIndex < posts.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = (e) => {
    e.stopPropagation();
    if (hasNext && onPostChange) {
      onPostChange(posts[currentIndex + 1]);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (hasPrev && onPostChange) {
      onPostChange(posts[currentIndex - 1]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="post-modal"
      aria-describedby="post-modal-description"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="relative w-full max-w-6xl max-h-[90vh] md:h-[85vh] outline-none flex items-center justify-center p-4">

        {/* Navigation Buttons (Desktop) */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white z-50 text-gray-800 shadow-lg transition-transform hover:scale-110"
          >
            <FaChevronLeft size={24} />
          </button>
        )}

        {hasNext && (
          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white z-50 text-gray-800 shadow-lg transition-transform hover:scale-110"
          >
            <FaChevronRight size={24} />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 md:-top-8 md:-right-8 text-white z-50 p-2 hover:opacity-80 drop-shadow-lg"
        >
          <FaTimes size={28} />
        </button>


        {/* Main Content Container */}
        <div className="flex flex-col md:flex-row w-full h-full bg-black md:rounded-r-xl md:rounded-l-xl overflow-hidden shadow-2xl">

          {/* Left Side: Image (Dark Theme) */}
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                className="w-full h-full object-cover"
                alt="Post"
              />
            ) : (
              <div className="text-gray-500">No Image</div>
            )}

            {/* Geo Tag Overlay (Desktop) - Expandable */}
            {post.geoData && (
              <div className="absolute bottom-4 left-4 hidden md:flex items-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white transition-all duration-300 ease-in-out group/geo overflow-hidden hover:pr-4 w-8 hover:w-auto hover:bg-black/60">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <FaMapMarkerAlt className="text-red-500" />
                </div>
                <div className="opacity-0 group-hover/geo:opacity-100 whitespace-nowrap transition-opacity duration-300 text-xs font-medium">
                  {post.geoData.city || post.geoData.country}
                  {post.geoData.address && <span className="opacity-70 ml-1 font-light">- {post.geoData.address}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Details (Light Theme) */}
          <div className="w-full md:w-[400px] lg:w-[450px] bg-white flex flex-col h-[50vh] md:h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={post.user?.photoURL || "/default-avatar.png"}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 object-cover cursor-pointer"
                  alt={post.user?.username}
                  onClick={() => {
                    handleClose();
                    navigate(`/profile/${post.user?.id}`);
                  }}
                />
                <div className="flex flex-col">
                  <span
                    className="font-semibold text-sm cursor-pointer hover:underline"
                    onClick={() => {
                      handleClose();
                      navigate(`/profile/${post.user?.id}`);
                    }}
                  >
                    {post.user?.username || "Unknown"}
                  </span>
                  {post.geoData && (
                    <span className="text-xs text-gray-500 block md:hidden">
                      {post.geoData.city || post.geoData.country}
                    </span>
                  )}
                </div>
              </div>

              {!isOwnPost && currentUserId && (
                <button
                  onClick={handleFollowToggle}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${isFollowing ? "bg-gray-100 text-gray-800" : "text-blue-500 hover:text-blue-700"
                    }`}
                >
                  {loading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            {/* Scrollable Content (Caption + Comments) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar relative">

              {/* Creator Caption - Styled as First Comment */}
              <div className="flex gap-3 mb-4">
                <img
                  src={post.user?.photoURL || "/default-avatar.png"}
                  className="w-8 h-8 rounded-full border border-gray-200 object-cover shrink-0"
                  alt={post.user?.username}
                />
                <div className="text-sm">
                  <span className="font-semibold mr-2">{post.user?.username}</span>
                  <span className="text-gray-800 whitespace-pre-wrap">{post.description}</span>
                  {/* Tags in Caption */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="text-blue-600 text-sm hover:underline cursor-pointer">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(post.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* No Separator Line */}

              {/* Comments List */}
              <div className="flex flex-col gap-4">
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8 hidden"> {/* Hidden if empty to look cleaner or show? Keeping hidden if just caption behaves as content */}
                    {/* User might want to see 'No comments' but since caption is there, it's fine. */}
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                      <img
                        src={comment.photoURL || "/default-avatar.png"}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                        alt={comment.username}
                      />
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-semibold mr-2 text-sm">{comment.username}</span>
                          <span className="text-gray-800 text-sm whitespace-pre-wrap">{comment.text}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>
                            {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate()) : "Just now"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 bg-white p-4 shrink-0 z-10 relative">
              <div className="flex items-center justify-between text-2xl mb-3">
                <div className="flex items-center gap-4 text-gray-800">
                  <button onClick={handleLike} className="hover:opacity-60 transition-opacity transform active:scale-125">
                    {liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                  </button>
                  <button className="hover:opacity-60 transition-opacity" onClick={() => document.getElementById('commentInput').focus()}>
                    <FaComment className="flip-x" />
                  </button>
                  <button className="hover:opacity-60 transition-opacity">
                    <FaPaperPlane />
                  </button>
                </div>
                <button className="hover:opacity-60 transition-opacity text-gray-800">
                  <FaRegBookmark />
                </button>
              </div>

              <div className="font-semibold text-sm mb-1">
                {likesCount} likes
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString(undefined, {
                  month: 'long', day: 'numeric', year: 'numeric'
                }) : "Just now"}
              </div>

              {/* Add Comment Input */}
              <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 relative">
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-xl text-gray-500 hover:text-gray-700 p-1"
                  >
                    <FaSmile className="text-yellow-500" />
                  </button>

                  {/* Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-10 left-0 z-50 shadow-xl">
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)}></div>
                      <div className="relative z-50">
                        <EmojiPicker onEmojiClick={onEmojiClick} height={350} width={300} searchDisabled={true} />
                      </div>
                    </div>
                  )}
                </div>

                <input
                  id="commentInput"
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  autoComplete="off"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="text-blue-500 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-700"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PostModal;