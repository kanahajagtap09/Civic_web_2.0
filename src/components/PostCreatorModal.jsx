import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  FaTimes,
  FaCamera,
  FaCheck,
  FaMapMarkerAlt,
  FaRedo,
  FaPlus,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { updateUserSticksOnPost } from "../firebase/userSticks";
import "react-toastify/dist/ReactToastify.css";
import "./PostCreatorModal.css";
import Lottie from "lottie-react";
import CheckedAnimation from "../assets/Checked.json";

const STEPS = { CAMERA: "camera", CROP: "crop", PREVIEW: "preview" };

export default function PostCreatorModal({ isOpen, onClose }) {
  const [step, setStep] = useState(STEPS.CAMERA);
  const [description, setDescription] = useState("");
  const [originalImageData, setOriginalImageData] = useState(null);
  const [croppedImageData, setCroppedImageData] = useState(null);
  const [tags, setTags] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cropContainerRef = useRef(null);
  const imageRef = useRef(null);

  // Crop state
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [dragType, setDragType] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });

  // --- Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch {
      toast.error("❌ Cannot access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    const vid = videoRef.current;
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(vid, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setOriginalImageData(dataUrl);
    stopCamera();
    setStep(STEPS.CROP);
    getLocation();
  };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          setGeoData({
            latitude,
            longitude,
            city: data.city || data.locality,
            region: data.principalSubdivision,
            country: data.countryName,
            address: `${data.city || data.locality}, ${
              data.principalSubdivision
            }, ${data.countryName}`,
          });
        } catch {
          /* silent */
        }
      },
      () => {}
    );
  };

  // --- Crop Interaction
  const startDrag = (e, type) => {
    e.preventDefault();
    setDragType(type);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
  };

  const onDragMove = (e) => {
    if (!dragType) return;
    e.preventDefault();

    const container = cropContainerRef.current;
    if (!container) return;

    const bounds = {
      width: container.offsetWidth,
      height: container.offsetHeight,
    };

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    startPos.current = { x: clientX, y: clientY };

    setCropArea((prev) => {
      let { x, y, width, height } = prev;

      const minSize = window.innerWidth < 640 ? 80 : 50;
      const maxWidth = bounds.width - 20;
      const maxHeight = bounds.height - 20;

      if (dragType === "move") {
        x = Math.max(10, Math.min(bounds.width - width - 10, x + deltaX));
        y = Math.max(10, Math.min(bounds.height - height - 10, y + deltaY));
      } else if (["top", "bottom", "left", "right"].includes(dragType)) {
        // Edge resizing
        if (dragType === "top") {
          const newY = Math.max(10, Math.min(y + deltaY, y + height - minSize));
          height = height + (y - newY);
          y = newY;
        } else if (dragType === "bottom") {
          height = Math.max(minSize, Math.min(maxHeight - y, height + deltaY));
        } else if (dragType === "left") {
          const newX = Math.max(10, Math.min(x + deltaX, x + width - minSize));
          width = width + (x - newX);
          x = newX;
        } else if (dragType === "right") {
          width = Math.max(minSize, Math.min(maxWidth - x, width + deltaX));
        }
      } else {
        // Corner resizing
        if (dragType.includes("left")) {
          const newX = Math.max(10, Math.min(x + deltaX, x + width - minSize));
          width = width + (x - newX);
          x = newX;
        }
        if (dragType.includes("right")) {
          width = Math.max(minSize, Math.min(maxWidth - x, width + deltaX));
        }
        if (dragType.includes("top")) {
          const newY = Math.max(10, Math.min(y + deltaY, y + height - minSize));
          height = height + (y - newY);
          y = newY;
        }
        if (dragType.includes("bottom")) {
          height = Math.max(minSize, Math.min(maxHeight - y, height + deltaY));
        }
      }

      return { x, y, width, height };
    });
  };

  const endDrag = () => setDragType(null);

  useEffect(() => {
    const moveHandler = (e) => onDragMove(e);
    const upHandler = () => endDrag();

    if (dragType) {
      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", upHandler);
      document.addEventListener("touchmove", moveHandler, { passive: false });
      document.addEventListener("touchend", upHandler);
    }

    return () => {
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", upHandler);
      document.removeEventListener("touchmove", moveHandler);
      document.removeEventListener("touchend", upHandler);
    };
  }, [dragType]);

  // --- Crop Result
  const finalizeCrop = () => {
    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const canvas = document.createElement("canvas");
    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    setCroppedImageData(canvas.toDataURL("image/jpeg", 0.9));
    setStep(STEPS.PREVIEW);
  };

  // --- Submit
  const handleSubmit = async () => {
    const user = getAuth().currentUser;
    if (!user) return toast.error("❌ Login required");
    setIsPosting(true);
    try {
      const ref = doc(collection(db, "posts"));
      const batch = writeBatch(db);
      batch.set(ref, {
        uid: user.uid,
        description,
        imageUrl: croppedImageData,
        tags,
        geoData,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", user.uid), { postCount: increment(1) });
      await batch.commit();
      await updateUserSticksOnPost(user.uid);

      setShowSuccessAnim(true);
      toast.success("🚀 Posted successfully!");
      setTimeout(cleanupAndClose, 2000);
    } catch (e) {
      console.error(e);
      toast.error("❌ Error posting");
    } finally {
      setIsPosting(false);
    }
  };

  const cleanupAndClose = () => {
    stopCamera();
    setStep(STEPS.CAMERA);
    setDescription("");
    setOriginalImageData(null);
    setCroppedImageData(null);
    setTags([]);
    setGeoData(null);
    setShowSuccessAnim(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      stopCamera();
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      stopCamera();
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  // Initialize crop area based on container size
  useEffect(() => {
    if (step === STEPS.CROP && cropContainerRef.current) {
      const container = cropContainerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      const size = Math.min(containerWidth, containerHeight) * 0.7;
      const x = (containerWidth - size) / 2;
      const y = (containerHeight - size) / 2;

      setCropArea({ x, y, width: size, height: size });
    }
  }, [step, originalImageData]);

  // Handle window resize for crop area
  useEffect(() => {
    const handleResize = () => {
      if (step === STEPS.CROP && cropContainerRef.current) {
        const container = cropContainerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        setCropArea(prev => {
          const maxX = containerWidth - prev.width;
          const maxY = containerHeight - prev.height;
          return {
            ...prev,
            x: Math.min(prev.x, Math.max(0, maxX)),
            y: Math.min(prev.y, Math.max(0, maxY))
          };
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-hidden" style={{ touchAction: "none" }}>
      <ToastContainer position="top-center" autoClose={2500} />
      {showSuccessAnim && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
          <Lottie animationData={CheckedAnimation} loop={false} style={{ width: 180 }} />
        </div>
      )}

      <div className="bg-white w-full h-full sm:rounded-xl sm:shadow-2xl sm:w-full sm:max-w-4xl sm:max-h-[90vh] sm:m-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-4 sm:px-6 py-3 sm:py-4">
          <button onClick={cleanupAndClose} className="text-gray-600 hover:text-gray-800">
            <FaTimes className="text-xl" />
          </button>
          <h2 className="font-semibold text-lg">Create New Post</h2>
          {step === STEPS.PREVIEW ? (
            <button
              onClick={handleSubmit}
              disabled={isPosting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {isPosting ? "Posting..." : "Share"}
            </button>
          ) : (
            <div className="w-[80px]" />
          )}
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 bg-gray-900 flex items-center justify-center relative min-h-[50vh] sm:min-h-[400px] overflow-hidden">
            {step === STEPS.CAMERA && (
              <div className="relative w-full h-full flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full" />
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-8 bg-white text-gray-800 p-4 rounded-full shadow-xl hover:bg-gray-100"
                >
                  <FaCamera className="text-2xl" />
                </button>
              </div>
            )}

            {/* ✅ Enhanced CROP Frame */}
            {step === STEPS.CROP && originalImageData && (
              <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
                <div
                  ref={cropContainerRef}
                  className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center"
                  style={{ userSelect: "none", touchAction: "none" }}
                >
                  <img
                    ref={imageRef}
                    src={originalImageData}
                    alt="Crop"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />

                  {/* Enhanced crop box with professional grid overlay */}
                  <div
                    className="absolute border-2 border-white cursor-move transition-all duration-150 ease-in-out"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                    }}
                    onMouseDown={(e) => startDrag(e, "move")}
                    onTouchStart={(e) => startDrag(e, "move")}
                  >
                    {/* Rule of Thirds Grid */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Horizontal lines */}
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50"></div>
                      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50"></div>
                      {/* Vertical lines */}
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50"></div>
                      
                      {/* Center crosshair */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-4 h-px bg-white/70"></div>
                        <div className="w-px h-4 bg-white/70 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                      
                      {/* Corner guides */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/60"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/60"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/60"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/60"></div>
                    </div>

                    {/* Enhanced corner handles */}
                    {["top-left", "top-right", "bottom-left", "bottom-right"].map(
                      (pos) => (
                        <div
                          key={pos}
                          className="absolute w-6 h-6 bg-white rounded-full border-2 border-blue-500 shadow-lg touch-manipulation hover:scale-110 transition-transform"
                          style={{
                            [pos.includes("top") ? "top" : "bottom"]: -12,
                            [pos.includes("left") ? "left" : "right"]: -12,
                            cursor: `${pos}-resize`,
                          }}
                          onMouseDown={(e) => startDrag(e, pos)}
                          onTouchStart={(e) => startDrag(e, pos)}
                        >
                          <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                        </div>
                      )
                    )}
                    
                    {/* Edge handles for better control */}
                    {["top", "right", "bottom", "left"].map((edge) => (
                      <div
                        key={edge}
                        className="absolute bg-white/80 hover:bg-white transition-colors"
                        style={{
                          [edge === "top" || edge === "bottom" ? "height" : "width"]: "4px",
                          [edge === "top" || edge === "bottom" ? "width" : "height"]: "20px",
                          [edge]: "-2px",
                          [edge === "top" || edge === "bottom" ? "left" : "top"]: "50%",
                          transform: "translate(-50%, 0)",
                          cursor: edge === "top" || edge === "bottom" ? "ns-resize" : "ew-resize",
                        }}
                        onMouseDown={(e) => startDrag(e, edge)}
                        onTouchStart={(e) => startDrag(e, edge)}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-900 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setStep(STEPS.CAMERA);
                      setOriginalImageData(null);
                      startCamera();
                    }}
                    className="bg-gray-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <FaRedo /> Retake
                  </button>
                  <button
                    onClick={finalizeCrop}
                    className="bg-green-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <FaCheck /> Done
                  </button>
                </div>
              </div>
            )}

            {step === STEPS.PREVIEW && croppedImageData && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <img
                  src={croppedImageData}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {step === STEPS.PREVIEW && (
            <div className="w-full lg:w-96 border-t lg:border-l flex flex-col bg-white h-[50vh] lg:h-auto">
              <div className="p-3 sm:p-4 flex-1 overflow-y-auto overscroll-contain">
                {geoData && (
                  <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm mb-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                    <span className="truncate">{geoData.address}</span>
                  </div>
                )}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Write a caption..."
                    className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </div>
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 sm:gap-2"
                      >
                        <span className="truncate max-w-[80px] sm:max-w-none">{tag}</span>
                        <button
                          onClick={() =>
                            setTags(tags.filter((_, idx) => idx !== i))
                          }
                          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <FaPlus /> Add Tag
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[999] p-0 sm:p-4">
          <div className="bg-white w-full sm:w-auto sm:min-w-[320px] sm:max-w-sm sm:rounded-lg shadow-lg animate-slide-up sm:animate-none">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Tag</h3>
              <input
                type="text"
                placeholder="Enter tag"
                className="w-full border border-gray-300 rounded-md p-3 mb-4 text-base"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-md text-sm sm:text-base"
                  onClick={() => setShowTagModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm sm:text-base"
                  onClick={() => {
                    if (tagInput.trim() && !tags.includes(`#${tagInput.trim()}`)) {
                      setTags([...tags, `#${tagInput.trim()}`]);
                    }
                    setTagInput("");
                    setShowTagModal(false);
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}