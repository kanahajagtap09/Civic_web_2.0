// // src/pages/SignUp.jsx
// import { useState } from "react";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { auth, db } from "../firebase/firebase";
// import { doc, setDoc } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";
// import { FiEye, FiEyeOff } from "react-icons/fi";

// const SignUp = () => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [profileImage, setProfileImage] = useState("");
//   const [imagePreview, setImagePreview] = useState("/default-profile.png");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // 📷 Handle profile image upload
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setProfileImage(reader.result);
//       setImagePreview(reader.result);
//     };
//     reader.readAsDataURL(file);
//   };

//   // 🚀 Handle form submission
//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     if (!name || !email || !password || !profileImage) {
//       setError("Please fill in all fields including a profile image.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const userCred = await createUserWithEmailAndPassword(auth, email, password);

//       await setDoc(doc(db, "users", userCred.user.uid), {
//         uid: userCred.user.uid,
//         name,
//         email,
//         profileImage,
//         createdAt: new Date().toISOString(),
//       });

//       navigate("/dashboard");
//     } catch (err) {
//       console.error("Signup Error:", err.message);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Toggle password visibility
//   const toggleShowPassword = () => {
//     setShowPassword((prev) => !prev);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800">
//       <form
//         onSubmit={handleSignup}
//         className="w-full max-w-sm bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 drop-shadow-2xl"
//       >
//         {/* Image Preview */}
//         <div className="flex justify-center mb-6">
//           <div className="w-24 h-24 rounded-full border-2 border-white overflow-hidden shadow-md">
//             <img
//               src={imagePreview}
//               alt="Profile Preview"
//               className="w-full h-full object-cover rounded-full"
//             />
//           </div>
//         </div>

//         {/* Heading */}
//         <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>

//         {/* Name Input */}
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Username"
//           className="w-full p-3 mb-4 rounded bg-white/20 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
//           required
//         />

//         {/* Email Input */}
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Email ID"
//           className="w-full p-3 mb-4 rounded bg-white/20 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
//           required
//         />

//         {/* Password Input with Toggle Eye */}
//         <div className="relative mb-4">
//           <input
//             type={showPassword ? "text" : "password"}
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Password (min 6 characters)"
//             className="w-full p-3 pr-10 rounded bg-white/20 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
//             required
//           />
//           <span
//             onClick={toggleShowPassword}
//             className="absolute right-3 top-3 text-white cursor-pointer"
//           >
//             {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
//           </span>
//         </div>

//         {/* File Upload */}
//         <div className="mb-4">
//           <label
//             htmlFor="profileUpload"
//             className="w-full block text-center cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 rounded-md font-semibold hover:scale-105 transition-transform"
//           >
//             Choose Profile Picture
//           </label>
//           <input
//             id="profileUpload"
//             type="file"
//             accept="image/*"
//             onChange={handleImageChange}
//             className="hidden"
//             required
//           />
//         </div>

//         {/* Error Message */}
//         {error && <p className="text-red-200 text-sm text-center mb-4">{error}</p>}

//         {/* Submit Button */}
//         <button
//           type="submit"
//           disabled={loading}
//           className={`w-full bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 py-3 rounded-md font-bold text-white transition-all ${
//             loading ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {loading ? "Creating..." : "Sign Up"}
//         </button>

//         {/* Login Redirect */}
//         <p className="text-sm text-white text-center mt-6">
//           Already have an account?
//           <a href="/login" className="text-pink-300 hover:underline ml-1">
//             Login
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// };

// export default SignUp;


import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
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
      setTimeout(() => navigate("/dashboard"), 2000); // Wait 2 seconds then redirect
    } catch (err) {
      console.error("Signup Error:", err.message);
      toast.error(err.message); // show error toast
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-start justify-center md:items-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800 ">
      <ToastContainer position="top-right" autoClose={3000} />
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 drop-shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full border-2 border-white overflow-hidden shadow-md">
            <img
              src={imagePreview}
              alt="Profile Preview"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Username"
          className="w-full p-3 mb-4 rounded bg-white/20 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email ID"
          className="w-full p-3 mb-4 rounded bg-white/20 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className="w-full p-3 pr-10 rounded bg-white/20 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <span
            onClick={toggleShowPassword}
            className="absolute right-3 top-3 text-white cursor-pointer"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </span>
        </div>

        <div className="mb-4">
          <label
            htmlFor="profileUpload"
            className="w-full block text-center cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 rounded-md font-semibold hover:scale-105 transition-transform"
          >
            Choose Profile Picture
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

        {error && <p className="text-red-200 text-sm text-center mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 py-3 rounded-md font-bold text-white transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-sm text-white text-center mt-6">
          Already have an account?
          <a href="/login" className="text-pink-300 hover:underline ml-1">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default SignUp;