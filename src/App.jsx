// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import CommentHomeFeed from "./Home/CommentHomeFeed";
import Navbar from "./components/Nav";
import BottomNav from "./components/BottomNav";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import SignUp from "./components/Signin";
import PrivateRoute from "./PrivateRoute";
import Profile from "./components/Profile";
import About from "./components/About";
import Contact from "./components/Contact";
import Edit_profile from "./Profile_Pages/Edit_profile";
import Follow from "./follow/follow";
import Following from "./follow/following";
import Map from "./Map/Map";

// 🆕 import Explore and SearchPage
import Explore from "./components/Dashboard";
import SearchPage from "./Explore/SearchPage";

const App = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 697);

  // Update state on window resize
  const handleResize = () => {
    setIsMobile(window.innerWidth < 697);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    // Cleanup on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Show Navbar for desktop */}
        {!isMobile && <Navbar />}
        
        {/* Main content area with mobile optimization */}
        <main 
          className={`
            flex-1 
            ${!isMobile ? 'ml-[240px]' : ''} 
            ${isMobile ? 'pb-14' : ''} 
            overflow-x-hidden
          `}
        >
          <div 
            className={`
              max-w-4xl 
              mx-auto 
              px-3 
              ${isMobile ? 'py-2' : 'py-6'}
              min-h-screen
            `}
          >
            {/* Mobile Bottom Nav */}
            {isMobile && <BottomNav />}
          <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 🔹 Explore page (protected) */}
        <Route
          path="/explore"
          element={
            <PrivateRoute>
              <Explore />
            </PrivateRoute>
          }
        />

        {/* 🔹 Dedicated search page (protected) */}
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          }
        />

        {/* Profile routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/Edit_profile"
          element={
            <PrivateRoute>
              <Edit_profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/following"
          element={
            <PrivateRoute>
              <Following />
            </PrivateRoute>
          }
        />

        <Route
          path="/follow"
          element={
            <PrivateRoute>
              <Follow />
            </PrivateRoute>
          }
        />

         <Route
    path="/comments/:postId"
    element={
      <PrivateRoute>
        <CommentHomeFeed />
      </PrivateRoute>
    }
  />


  <Route
  path="/map"
  element={
    <PrivateRoute>
      <Map />
    </PrivateRoute>
  }
/>
          </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;