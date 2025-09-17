import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase"; // ✅ db added
import { doc, setDoc, getDoc } from "firebase/firestore"; // ✅ Firestore imports
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Google login handler with Firestore save
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);

      // Save to Firestore if not already present
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

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
    <div className="min-h-screen flex items-start justify-center md:items-center  bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900">
      <ToastContainer position="top-right" autoClose={3000} />

      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm mt-2.5 bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 drop-shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-white opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 18.364A9.953 9.953 0 0012 21c2.485 0 4.77-.895 6.364-2.364M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <input
          type="email"
          placeholder="Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-md bg-white/20 placeholder-white focus:outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded-md bg-white/20 placeholder-white focus:outline-none"
          required
        />

        <div className="flex items-center mb-4 justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-pink-400" />
            Remember me
          </label>
          <a href="#" className="text-white/80 hover:underline text-xs">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 rounded-md font-bold uppercase tracking-wider hover:scale-105 transition-transform ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className={`w-full flex items-center justify-center gap-2 mt-4 bg-white text-gray-800 py-3 rounded-md font-bold uppercase tracking-wider hover:scale-105 transition-transform ${
            googleLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          {googleLoading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-sm text-white text-center mt-6">
          Don&apos;t have an account?
          <a href="/signup" className="text-pink-300 hover:underline ml-1">
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
