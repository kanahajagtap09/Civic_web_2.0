import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import ScrollNavbar from "./components/ScrollNavbar";
import Explore from "./components/Dashboard";
import SearchPage from "./Explore/SearchPage";
import Championship from "./components/Championship";
import { useAuth } from "./context/AuthContext"; // Add this import

const AppLayout = ({ isMobile }) => {
  const location = useLocation();
  const { user } = useAuth(); // Get auth status

  // ✅ Only hide navs on login/signup pages
  const authRoutes = ["/login", "/signup"];
  const isAuthPage = authRoutes.includes(location.pathname);
  
  // ✅ For home page, show navs only if user is logged in
  const isHomePage = location.pathname === "/";
  const hideNavs = isAuthPage || (isHomePage && !user);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar - hide on auth pages */}
      {!isMobile && !hideNavs && <Navbar />}
      
      {/* Mobile top navbar - hide on auth pages */}
      {isMobile && !hideNavs && <ScrollNavbar />}

      <main
        className={`
          flex-1 
          ${!isMobile && !hideNavs ? "ml-[240px]" : ""} 
          ${isMobile && !hideNavs ? "pb-14" : ""} 
          overflow-x-hidden
        `}
      >
        <div
          className={`
            max-w-4xl 
            mx-auto 
            px-3 
            ${isMobile ? "py-2" : "py-6"}
            min-h-screen
          `}
        >
          {/* Mobile bottom navbar - hide on auth pages */}
          {isMobile && !hideNavs && <BottomNav />}

          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <PrivateRoute>
                  <Explore />
                </PrivateRoute>
              }
            />
            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <SearchPage />
                </PrivateRoute>
              }
            />
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
            <Route
              path="/championship"
              element={
                <PrivateRoute>
                  <Championship />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 697);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 697);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <AppLayout isMobile={isMobile} />
    </Router>
  );
};

export default App;