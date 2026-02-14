import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
import { useAuth } from "./context/AuthContext";
import ScrollToTop from "./ScrollToTop";

// ✅ Import the new pages
import Updates from "./topbarUpdates/Updates";
import Details from "./topbarUpdates/Details";
import UserProfileSearching from "./Explore/UserProfileSearching";

// Layout separates nav + main content
const AppLayout = ({ isMobile }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  // ✅ Define public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/about", "/contact"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // ✅ If not loading, not logged in, and not on a public route, redirect to login
  if (!loading && !user && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Hide navs on auth pages AND specific sub-pages (updates, details, etc.)
  const hideNavRoutes = [
    "/login",
    "/signup",
    "/updates",
  ];
  const hideNavs = hideNavRoutes.some(route => location.pathname.startsWith(route)) || location.pathname.startsWith("/details/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar - only show when logged in and not on auth pages */}
      {!isMobile && !hideNavs && user && <Navbar />}

      {/* Mobile top navbar - only show when logged in and not on auth pages */}
      {isMobile && !hideNavs && user && <ScrollNavbar />}

      <main
        className={`
          flex-1 
          ${isMobile && !hideNavs && user ? "pb-14" : ""} 
          ${!isMobile && !hideNavs && user ? "ml-[64px]" : ""}
          overflow-x-hidden
        `}
      >
        {/* ✅ This ensures scrolling resets on every route change */}
        <ScrollToTop />

        <div
          className={`
            w-full
            min-h-screen
            ${isMobile ? "px-0 pb-16" : ""} 
          `}
        >
          {/* Mobile bottom navbar - only show when logged in and not on auth pages */}
          {isMobile && !hideNavs && user && <BottomNav />}

          <Routes>
            {/* Public routes - accessible without login */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            {/* Protected routes - require authentication */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
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

            {/* ✅ New Updates routes */}
            <Route
              path="/updates"
              element={
                <PrivateRoute>
                  <Updates />
                </PrivateRoute>
              }
            />
            <Route
              path="/details/:id"
              element={
                <PrivateRoute>
                  <Details />
                </PrivateRoute>
              }
            />

            <Route
              path="/search-user/:id"
              element={
                <PrivateRoute>
                  <UserProfileSearching />
                </PrivateRoute>
              }
            />

            {/* Catch all - redirect to login if not authenticated */}
            <Route path="*" element={<Navigate to="/login" replace />} />
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