import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiUpload } from "react-icons/fi"; // ✅ Added FiUpload
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [imagePreview, setImagePreview] = useState("/default-profile.png");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !email || !password || !profileImage) {
      setError("Please fill in all fields including a profile image.");
      setLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name,
        email,
        profileImage,
        createdAt: new Date().toISOString(),
      });

      toast.success("Account created successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("Signup Error:", err.message);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Full Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-700"></div>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Signup Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 z-10">
        {/* Logo Title */}
        <div className="text-center mb-6">
          <h1
            className="text-4xl font-bold text-[#782048] tracking-wide"
            style={{ fontFamily: "'Cinzel','Times New Roman',serif" }}
          >
            CIVIC
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        {/* Profile Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full border border-gray-300 overflow-hidden shadow">
            <img
              src={imagePreview}
              alt="Profile Preview"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username"
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
            required
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email ID"
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 pr-10"
              required
            />
            <span
              onClick={toggleShowPassword}
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </span>
          </div>

          {/* Upload → styled like Google button */}
          <div>
            <label
              htmlFor="profileUpload"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 transition"
            >
              <FiUpload className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Choose Profile Picture</span>
            </label>
            <input
              id="profileUpload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Instagram-Style Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#0095f6] text-white py-2 rounded-lg font-semibold transition hover:bg-[#0077cc] ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <span className="flex-1 h-px bg-gray-300"></span>
          <span className="mx-3 text-gray-400 text-sm font-semibold">OR</span>
          <span className="flex-1 h-px bg-gray-300"></span>
        </div>

        {/* Redirect Login */}
        <p className="text-center text-gray-600 text-sm">
          Already have an account?
          <a
            href="/login"
            className="text-[#0095f6] font-semibold hover:underline ml-1"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;