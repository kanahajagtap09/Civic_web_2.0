import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { updateUserSticksOnPost } from "../firebase/userSticks";
import "react-toastify/dist/ReactToastify.css";
import "./PostCreatorModal.css";
import Lottie from "lottie-react";
import CheckedAnimation from "../assets/Checked.json";
import Cropper from "react-easy-crop";

const STEPS = { CAMERA: "camera", CROP: "crop", PREVIEW: "preview" };

// --- Helper: createImage ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// --- Helper: getCroppedImg ---
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // set canvas size to match the bounding box
  canvas.width = image.width;
  canvas.height = image.height;

  // draw image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image playing with the top left corner of "current" context
  ctx.putImageData(data, 0, 0);

  // As Base64 string
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function PostCreatorModal({ isOpen, onClose }) {
  const [step, setStep] = useState(STEPS.CAMERA);
  const [description, setDescription] = useState("");
  const [originalImageData, setOriginalImageData] = useState(null);
  const [croppedImageData, setCroppedImageData] = useState(null);
  // Removed Tags state
  const [geoData, setGeoData] = useState(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Camera Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Crop State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // --- Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const vid = videoRef.current;

    // Set canvas dimensions to match the video
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Flip horizontal for selfie mode if needed, but standard camera usually expects mirror
      // For now, drawing directly
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
            address: `${data.city || data.locality}, ${data.principalSubdivision
              }, ${data.countryName}`,
          });
        } catch {
          /* silent */
        }
      },
      () => { }
    );
  };

  // --- Crop Logic
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const finalizeCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(
        originalImageData,
        croppedAreaPixels
      );
      setCroppedImageData(croppedImage);
      setStep(STEPS.PREVIEW);
    } catch (e) {
      console.error(e);
      toast.error("Error cropping image");
    }
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
        tags: [], // Removed tags
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
    setGeoData(null);
    setShowSuccessAnim(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      document.body.style.overflow = "hidden";
    } else {
      stopCamera();
      document.body.style.overflow = "";
    }
    return () => {
      stopCamera();
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      style={{ touchAction: "none" }}
    >
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
          <button onClick={cleanupAndClose} className="text-gray-600">
            <FaTimes className="text-xl" />
          </button>
          <h2 className="font-semibold text-lg">Create Post</h2>
          {step === STEPS.PREVIEW ? (
            <button
              onClick={handleSubmit}
              disabled={isPosting}
              className="text-blue-600 font-bold text-lg disabled:opacity-50"
            >
              {isPosting ? "Sharing..." : "Share"}
            </button>
          ) : (
            <div className="w-[80px]" /> // spacer
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

              {/* Bottom Camera Controls using Overlay */}
              <div className="absolute bottom-10 flex gap-8 items-center z-20">
                {/* Capture Button */}
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CROP (React Easy Crop) */}
          {step === STEPS.CROP && originalImageData && (
            <div className="relative w-full h-full bg-black">
              <Cropper
                image={originalImageData}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5} // Suggested aspect ratio for feed posts
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain" // Ensures whole image is visible if user wants
                showGrid={true}
              />
              {/* Crop Controls */}
              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={finalizeCrop}
                  className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2"
                >
                  Next <FaCheck />
                </button>
              </div>
              <div className="absolute top-4 left-4 z-30">
                <button
                  onClick={() => setStep(STEPS.CAMERA)}
                  className="bg-black/50 text-white px-3 py-2 rounded-full backdrop-blur-md"
                >
                  <FaRedo />
                </button>
              </div>

              {/* Zoom Slider */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 z-30">
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
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
                  />
                  <div className="h-px bg-gray-200 w-full my-2" />

                  {/* Geo Tag Display */}
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-2 text-sm">
                      <FaMapMarkerAlt className="text-gray-400" />
                      {geoData ? (
                        <span className="text-gray-800 font-medium">{geoData.city || geoData.region || "Location inferred"}</span>
                      ) : (
                        <span className="text-gray-400">Location will be added automatically</span>
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