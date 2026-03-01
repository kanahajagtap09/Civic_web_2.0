import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiUpload } from "react-icons/fi";
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
      setTimeout(() => navigate("/"), 2000);
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
      {/* Professional Background - Subtle Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Signup Card */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl p-8 sm:p-10 z-10 border-t-4 border-[#782048] scrollbar-hide max-h-screen overflow-y-auto">
        {/* Logo Title */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[#782048] tracking-wider"
            style={{ fontFamily: "'Cinzel','Times New Roman',serif" }}
          >
            CIVIC
          </h1>
          <p className="text-gray-600 text-xs mt-2 uppercase tracking-wide font-semibold">Civic Issue Management Platform</p>
          <p className="text-gray-500 text-sm mt-3">Create your civic account</p>
        </div>

        {/* Profile Preview */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-[#782048] overflow-hidden shadow-md bg-gray-100">
            <img
              src={imagePreview}
              alt="Profile Preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#782048] focus:border-transparent transition-all"
            required
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#782048] focus:border-transparent transition-all"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#782048] focus:border-transparent transition-all pr-10"
              required
            />
            <span
              onClick={toggleShowPassword}
              className="absolute right-3 top-3 text-gray-500 cursor-pointer hover:text-gray-700"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </span>
          </div>

          {/* Upload Profile Picture */}
          <div>
            <label
              htmlFor="profileUpload"
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-gray-700 py-2.5 rounded-md border border-gray-300 cursor-pointer hover:bg-slate-200 transition-all"
            >
              <FiUpload className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Upload Profile Picture</span>
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

          {error && <p className="text-red-600 text-sm text-center font-semibold">{error}</p>}

          {/* Professional Brand Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#782048] hover:bg-[#5c1838] text-white py-2.5 rounded-md font-semibold transition-all duration-200 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <span className="flex-1 h-px bg-gray-300"></span>
          <span className="mx-3 text-gray-400 text-xs font-semibold">OR</span>
          <span className="flex-1 h-px bg-gray-300"></span>
        </div>

        {/* Redirect Login */}
        <p className="text-center text-gray-600 text-sm">
          Already have an account?
          <a
            href="/login"
            className="text-[#782048] font-semibold hover:text-[#5c1838] ml-1"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
