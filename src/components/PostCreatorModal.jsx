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

  // --- Submit (Original Working Version)
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
        imageUrl: croppedImageData, // Base64 for now (works for smaller images)
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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <ToastContainer position="top-center" autoClose={2500} />

      {showSuccessAnim && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
          <Lottie
            animationData={CheckedAnimation}
            loop={false}
            style={{ width: 180 }}
          />
        </div>
      )}

      <div className="bg-white w-full h-full sm:rounded-xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-white z-10">
          <button onClick={cleanupAndClose} className="text-gray-600 hover:text-gray-800">
            <FaTimes className="text-xl" />
          </button>
          <h2 className="font-semibold text-lg">Create Post</h2>
          {step === STEPS.PREVIEW ? (
            <button
              onClick={handleSubmit}
              disabled={isPosting}
              className="text-blue-600 font-bold text-lg disabled:opacity-50 hover:text-blue-700"
            >
              {isPosting ? "Sharing..." : "Share"}
            </button>
          ) : (
            <div className="w-[80px]" />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex flex-col bg-black overflow-hidden">

          {/* STEP 1: CAMERA */}
          {step === STEPS.CAMERA && (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Capture Button */}
              <div className="absolute bottom-10 flex gap-8 items-center z-20">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CROP (React Image Crop) */}
          {step === STEPS.CROP && originalImageData && (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined} // Free-form crop
                className="max-h-full"
              >
                <img
                  ref={imgRef}
                  src={originalImageData}
                  alt="Crop"
                  className="max-h-[80vh] max-w-full"
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

              {/* Crop Controls */}
              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={finalizeCrop}
                  className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-gray-100"
                >
                  Next <FaCheck />
                </button>
              </div>
              <div className="absolute top-4 left-4 z-30">
                <button
                  onClick={retakePhoto}
                  className="bg-black/50 text-white px-3 py-2 rounded-full backdrop-blur-md hover:bg-black/70 flex items-center gap-2"
                >
                  <FaRedo /> Retake
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW (Original Layout) */}
          {step === STEPS.PREVIEW && croppedImageData && (
            <div className="flex flex-col h-full bg-white">
              <div className="flex-1 bg-gray-50 flex flex-col sm:flex-row overflow-hidden">

                {/* Image Preview */}
                <div className="w-full sm:w-1/2 h-[50vh] sm:h-auto bg-black flex items-center justify-center">
                  <img
                    src={croppedImageData}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Details Input */}
                <div className="w-full sm:w-1/2 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={getAuth().currentUser?.photoURL || "/default-avatar.png"}
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <span className="font-semibold text-gray-800">
                      {getAuth().currentUser?.displayName || "User"}
                    </span>
                  </div>

                  <textarea
                    className="w-full p-0 text-base text-gray-700 placeholder-gray-400 border-none focus:ring-0 resize-none"
                    rows="4"
                    placeholder="Write a caption..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    autoFocus
                  />

                  <div className="h-px bg-gray-200 w-full my-2" />

                  {/* Geo Tag Display */}
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-2 text-sm">
                      <FaMapMarkerAlt className="text-gray-400" />
                      {geoData ? (
                        <span className="text-gray-800 font-medium">
                          {geoData.city || geoData.region || "Location"}
                        </span>
                      ) : (
                        <span className="text-gray-400">Add location</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}