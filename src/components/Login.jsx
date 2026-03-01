import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Google login handler
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);

      if (!existing.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          profileImage: user.photoURL || "",
          provider: "google",
          verified: user.emailVerified,
          createdAt: new Date().toISOString(),
        });
      }

      toast.success("Google login successful 🎉");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error("Google login failed: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ✅ Email login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast.success("Login successful 🎉");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          toast.error("No account found. Please sign up first.");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format.");
          break;
        default:
          toast.error("Login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Professional Background - Subtle Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl p-8 sm:p-10 z-10 border-t-4 border-[#782048]">
        {/* Brand Title */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[#782048] tracking-wider"
            style={{ fontFamily: "'Cinzel','Times New Roman',serif" }}
          >
            CIVIC
          </h1>
          <p className="text-gray-600 text-xs mt-2 uppercase tracking-wide font-semibold">Civic Issue Management Platform</p>
          <p className="text-gray-500 text-sm mt-3">Login to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#782048] focus:border-transparent transition-all"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#782048] focus:border-transparent transition-all"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="accent-[#782048]" />
              Remember me
            </label>
            <a href="#" className="text-[#782048] hover:text-[#5c1838] font-semibold text-xs">
              Forgot password?
            </a>
          </div>

          {/* Professional Brand Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#782048] hover:bg-[#5c1838] text-white py-2.5 rounded-md font-semibold transition-all duration-200 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <span className="flex-1 h-px bg-gray-300"></span>
          <span className="mx-3 text-gray-400 text-xs font-semibold">OR</span>
          <span className="flex-1 h-px bg-gray-300"></span>
        </div>

        {/* Google Button - Professional */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className={`w-full flex items-center justify-center gap-2 bg-slate-100 text-gray-700 py-2.5 rounded-md border border-gray-300 hover:bg-slate-200 transition-all ${
            googleLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Footer */}
        <p className="text-sm text-gray-600 text-center mt-8">
          Don&apos;t have an account?
          <a href="/signup" className="text-[#782048] font-semibold hover:text-[#5c1838] ml-1">
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
