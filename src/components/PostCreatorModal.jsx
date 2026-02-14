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
  FaCheck,
  FaMapMarkerAlt,
  FaRedo,
  FaGlobeAmericas,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { updateUserSticksOnPost } from "../firebase/userSticks";
import "react-toastify/dist/ReactToastify.css";
import "./PostCreatorModal.css";
import Lottie from "lottie-react";
import CheckedAnimation from "../assets/Checked.json";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const STEPS = { CAMERA: "camera", CROP: "crop", PREVIEW: "preview" };

export default function PostCreatorModal({ isOpen, onClose }) {
  const [step, setStep] = useState(STEPS.CAMERA);
  const [description, setDescription] = useState("");
  const [originalImageData, setOriginalImageData] = useState(null);
  const [croppedImageData, setCroppedImageData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showGeoDetails, setShowGeoDetails] = useState(false);

  // Camera Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Crop State for react-image-crop
  const [crop, setCrop] = useState({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  // --- Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error(err);
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
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const vid = videoRef.current;

    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(vid, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setOriginalImageData(dataUrl);
      stopCamera();
      setStep(STEPS.CROP);
      getLocation();
    }
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
            address: `${data.city || data.locality}, ${data.principalSubdivision}, ${data.countryName}`,
            fullAddress: data.localityInfo?.administrative || [],
          });
        } catch {
          /* silent */
        }
      },
      () => { }
    );
  };

  // --- Crop Logic with react-image-crop
  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) {
      toast.error("Please adjust the crop area");
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const finalizeCrop = () => {
    const croppedImage = getCroppedImg();
    if (croppedImage) {
      setCroppedImageData(croppedImage);
      setStep(STEPS.PREVIEW);
    }
  };

  // --- Submit
  const handleSubmit = async () => {
    const user = getAuth().currentUser;
    if (!user) return toast.error("❌ Login required");
    if (!croppedImageData) return toast.error("❌ No image to upload");

    setIsPosting(true);
    try {
      const splitTags = (description.match(/#[a-zA-Z0-9_]+/g) || []).map((tag) =>
        tag.toLowerCase()
      );

      const ref = doc(collection(db, "posts"));
      const batch = writeBatch(db);

      batch.set(ref, {
        uid: user.uid,
        userId: user.uid,
        description,
        imageUrl: croppedImageData,
        tags: splitTags,
        geoData,
        status: "pending",
        createdAt: serverTimestamp(),
        likes: [],
        commentsCount: 0,
      });

      batch.update(doc(db, "users", user.uid), { postCount: increment(1) });
      await batch.commit();
      await updateUserSticksOnPost(user.uid);

      setShowSuccessAnim(true);
      toast.success("🚀 Posted successfully!");
      setTimeout(cleanupAndClose, 2000);
    } catch (e) {
      console.error("Post Error:", e);
      toast.error("❌ Error posting: " + e.message);
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
    setGeoData(null);
    setShowSuccessAnim(false);
    setIsPosting(false);
    setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    setCompletedCrop(null);
    setShowGeoDetails(false);
    onClose();
  };

  const retakePhoto = () => {
    setOriginalImageData(null);
    setCroppedImageData(null);
    setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    setCompletedCrop(null);
    setStep(STEPS.CAMERA);
    startCamera();
  };

  useEffect(() => {
    if (isOpen && step === STEPS.CAMERA) {
      startCamera();
      document.body.style.overflow = "hidden";
    } else if (!isOpen) {
      stopCamera();
      document.body.style.overflow = "";
    }
    return () => {
      stopCamera();
      document.body.style.overflow = "";
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
      <ToastContainer position="top-center" autoClose={2500} theme="dark" />

      {showSuccessAnim && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
          <Lottie
            animationData={CheckedAnimation}
            loop={false}
            style={{ width: 200 }}
          />
        </div>
      )}

      {/* Fixed Size Modal Container */}
      <div className="bg-white w-full h-full md:w-[90vw] md:max-w-5xl md:h-[85vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header - Instagram Style */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-white z-10 flex-shrink-0">
          <button
            onClick={cleanupAndClose}
            className="text-gray-700 hover:text-gray-900 transition p-1"
          >
            <FaTimes className="text-2xl" />
          </button>
          <h2 className="font-bold text-lg tracking-tight">
            {step === STEPS.CAMERA && "Take Photo"}
            {step === STEPS.CROP && "Crop"}
            {step === STEPS.PREVIEW && "Create new post"}
          </h2>
          {step === STEPS.PREVIEW ? (
            <button
              onClick={handleSubmit}
              disabled={isPosting}
              className="text-blue-500 font-semibold text-base disabled:opacity-50 hover:text-blue-600 transition"
            >
              {isPosting ? "Sharing..." : "Share"}
            </button>
          ) : (
            <div className="w-[60px]" />
          )}
        </div>

        {/* Content Area - Fixed Height */}
        <div className="flex-1 relative flex flex-col overflow-hidden">

          {/* STEP 1: CAMERA */}
          {step === STEPS.CAMERA && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Capture Button - Instagram Style */}
              <div className="absolute bottom-8 flex gap-8 items-center z-20">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                >
                  <div className="w-16 h-16 bg-white rounded-full" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CROP */}
          {step === STEPS.CROP && originalImageData && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined}
                className="max-h-full max-w-full"
              >
                <img
                  ref={imgRef}
                  src={originalImageData}
                  alt="Crop"
                  style={{ maxHeight: '100%', maxWidth: '100%', display: 'block' }}
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget;
                    setCrop({
                      unit: "%",
                      width: 90,
                      height: 90,
                      x: 5,
                      y: 5,
                    });
                  }}
                />
              </ReactCrop>

              {/* Crop Controls - Instagram Style */}
              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={finalizeCrop}
                  className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg hover:bg-blue-600 transition flex items-center gap-2"
                >
                  Next <FaCheck />
                </button>
              </div>
              <div className="absolute top-4 left-4 z-30">
                <button
                  onClick={retakePhoto}
                  className="bg-gray-800/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <FaRedo /> Retake
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW - Instagram Layout */}
          {step === STEPS.PREVIEW && croppedImageData && (
            <div className="absolute inset-0 flex flex-col md:flex-row bg-white">

              {/* Left: Image Preview - Fixed Size */}
              <div className="w-full md:w-[60%] h-[45vh] md:h-full bg-black flex items-center justify-center flex-shrink-0">
                <img
                  src={croppedImageData}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Right: Details - Fixed Size */}
              <div className="w-full md:w-[40%] flex flex-col bg-white overflow-hidden">

                {/* User Info */}
                <div className="flex items-center gap-3 p-4 border-b flex-shrink-0">
                  <img
                    src={getAuth().currentUser?.photoURL || "/default-avatar.png"}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <span className="font-semibold text-gray-900">
                    {getAuth().currentUser?.displayName || "User"}
                  </span>
                </div>

                {/* Caption Input - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <textarea
                    className="w-full h-full p-4 text-base text-gray-900 placeholder-gray-400 border-none focus:ring-0 resize-none"
                    placeholder="Write a caption..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Location - Expandable on Hover */}
                {geoData && (
                  <div className="border-t flex-shrink-0">
                    <div
                      className="relative group"
                      onMouseEnter={() => setShowGeoDetails(true)}
                      onMouseLeave={() => setShowGeoDetails(false)}
                    >
                      {/* Collapsed View */}
                      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition">
                        <FaMapMarkerAlt className="text-gray-500 text-lg" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {geoData.city || geoData.region}
                          </p>
                          <p className="text-xs text-gray-500">
                            {geoData.country}
                          </p>
                        </div>
                        <FaGlobeAmericas className="text-gray-400" />
                      </div>

                      {/* Expanded Details on Hover */}
                      {showGeoDetails && (
                        <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mb-2 p-4 z-50 animate-fade-in">
                          <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-blue-500" />
                            Location Details
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">City:</span>
                              <span className="font-medium text-gray-900">{geoData.city || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Region:</span>
                              <span className="font-medium text-gray-900">{geoData.region || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Country:</span>
                              <span className="font-medium text-gray-900">{geoData.country || "N/A"}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2" />
                            <div className="flex justify-between">
                              <span className="text-gray-500">Latitude:</span>
                              <span className="font-mono text-gray-900">{geoData.latitude.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Longitude:</span>
                              <span className="font-mono text-gray-900">{geoData.longitude.toFixed(6)}</span>
                            </div>
                            {geoData.address && (
                              <>
                                <div className="h-px bg-gray-200 my-2" />
                                <div>
                                  <span className="text-gray-500 block mb-1">Full Address:</span>
                                  <p className="text-gray-900 leading-relaxed">{geoData.address}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}