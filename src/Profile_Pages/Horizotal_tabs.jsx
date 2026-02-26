import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import GridOnIcon from "@mui/icons-material/GridOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { FaHeart, FaRegComment, FaPlay } from "react-icons/fa";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import PostModal from "../Explore/ExploreModel/Postmodel";

// ---------------------------------------------------
// CalendarStreak component (unchanged)
// ---------------------------------------------------
const CalendarStreak = () => {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [streakData, setStreakData] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 697);
  const { user } = useAuth();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 697);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const ref = doc(db, "userSticks", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setStreakData(snap.data());
    });
    return () => unsub();
  }, [user]);

  const streakDays = React.useMemo(() => {
    if (!streakData?.streakDays) return [];
    return streakData.streakDays
      .map((s) => new Date(s))
      .filter((d) => d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate());
  }, [streakData, month, year]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
  const weeks = [];
  let currDay = 1;
  for (let i = 0; i < totalCells; i++) {
    if (i % 7 === 0) weeks.push([]);
    if (i < firstDay || currDay > daysInMonth) weeks.at(-1).push(null);
    else weeks.at(-1).push(currDay++);
  }

  const handlePrev = () =>
    month === 0
      ? (setMonth(11), setYear((y) => y - 1))
      : setMonth((m) => m - 1);
  const handleNext = () =>
    month === 11
      ? (setMonth(0), setYear((y) => y + 1))
      : setMonth((m) => m + 1);

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  return (
    <Box
      sx={{
        width: "100%",
        border: "1px solid #ddd",
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      {streakData && (
        <Box
          sx={{
            p: isMobile ? 1.5 : 2,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-around",
            bgcolor: "#fafafa",
            gap: isMobile ? 1 : 2,
          }}
        >
          <div className="flex flex-col items-center">
            <div className={`flex items-center gap-1 ${isMobile ? "text-lg" : "text-2xl"} font-bold`}>
              {streakData.currentStreak}
              <WhatshotIcon sx={{ color: "orange", fontSize: isMobile ? 18 : 24 }} />
            </div>
            <div className={`${isMobile ? "text-[10px]" : "text-xs"} text-gray-600 text-center`}>
              Current Streak
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`flex items-center gap-1 ${isMobile ? "text-lg" : "text-2xl"} font-bold`}>
              {streakData.longestStreak}
              <WhatshotIcon sx={{ color: "orange", fontSize: isMobile ? 18 : 24 }} />
            </div>
            <div className={`${isMobile ? "text-[10px]" : "text-xs"} text-gray-600 text-center`}>
              Longest Streak
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`${isMobile ? "text-lg" : "text-2xl"} font-bold`}>
              +{streakData.currentPostPoints || 0}
            </div>
            <div className={`${isMobile ? "text-[10px]" : "text-xs"} text-gray-600 text-center`}>
              Points Today
            </div>
          </div>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: isMobile ? 1.5 : 2,
          borderBottom: "1px solid #eee",
          bgcolor: "#fafafa",
          gap: isMobile ? 1 : 2,
        }}
      >
        <ChevronLeftIcon
          onClick={handlePrev}
          sx={{
            cursor: "pointer",
            color: "text.secondary",
            fontSize: isMobile ? 20 : 24,
            flexShrink: 0,
          }}
        />
        <span className={`font-semibold whitespace-nowrap text-xs md:text-sm`}>
          {months[month]} {year}
        </span>
        <ChevronRightIcon
          onClick={handleNext}
          sx={{
            cursor: "pointer",
            color: "text.secondary",
            fontSize: isMobile ? 20 : 24,
            flexShrink: 0,
          }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: isMobile ? 0.5 : 1,
          p: isMobile ? 1 : 2,
          width: "100%",
        }}
      >
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const isToday =
              day &&
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            const isStreak = day && streakDays.includes(day);
            const cellSize = isMobile ? 32 : 40;
            return (
              <Box
                key={`${wi}-${di}`}
                sx={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isToday ? "2px solid #1976d2" : "none",
                  margin: "0 auto",
                }}
              >
                {day ? (
                  isStreak ? (
                    <WhatshotIcon sx={{ color: "orange", fontSize: isMobile ? 16 : 22 }} />
                  ) : (
                    <span
                      className={`text-xs md:text-sm ${isToday ? "text-blue-600 font-bold" : ""
                        }`}
                    >
                      {day}
                    </span>
                  )
                ) : null}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------
// Tab panel helper
// ---------------------------------------------------
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}
CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

// ---------------------------------------------------
// PostGrid (9:16 layout, 3-column desktop, 2-column tablet)
// ---------------------------------------------------
const PostGrid = () => {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState([]);
  const [selectedPost, setSelectedPost] = React.useState(null);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "posts"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => {
        const postData = doc.data();
        return {
          id: doc.id,
          ...postData,
          likesCount: postData.likesCount || 0,
          commentsCount: postData.commentsCount || 0,
          user: {
            id: postData.userId || postData.uid || user?.uid,
            username: postData.username || postData.displayName || user?.displayName || "User",
            photoURL: postData.userPhoto || postData.photoURL || user?.photoURL || "/default-avatar.png",
          }
        };
      });
      setPosts(data);
    });
    return () => unsub();
  }, [user]);

  if (!posts.length)
    return (
      <div className="text-center text-gray-400 py-10">No posts yet.</div>
    );

  return (
    <>
      {/* --- Vertical-post balanced grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[12px] bg-white">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative group cursor-pointer overflow-hidden bg-black"
            onClick={() => setSelectedPost(post)}
          >
            {/* 9:16 aspect ratio but nice width (less skinny than raw 9/16) */}
            <img
              src={post.imageUrl || post.imageBase64 || "/default-avatar.png"}
              alt={post.description || "post"}
              className="w-full aspect-[3/4] md:aspect-[4/5] lg:aspect-[9/11] object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* small play icon for videos */}
            {post.type === "video" && (
              <FaPlay className="absolute top-2 right-2 text-white text-sm opacity-90" />
            )}

            {/* overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white">
              <div className="flex items-center gap-1 text-sm font-semibold">
                <FaHeart className="text-lg" />
                <span>{post.likesCount}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                <FaRegComment className="text-lg" />
                <span>{post.commentsCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PostModal
        open={!!selectedPost}
        handleClose={() => setSelectedPost(null)}
        post={selectedPost}
        posts={posts}
        onPostChange={setSelectedPost}
      />
    </>
  );
};

// ---------------------------------------------------
// Main HorizontalTabs container
// ---------------------------------------------------
export default function HorizontalTabs({ showCalendarOnly = false, showPostsOnly = false }) {
  const [value, setValue] = React.useState(0);
  const handleChange = (_, val) => setValue(val);

  // Desktop left column: calendar/streak only
  if (showCalendarOnly) {
    return <CalendarStreak />;
  }

  // Desktop right column: post grid only (no tabs, no calendar)
  if (showPostsOnly) {
    return <PostGrid />;
  }

  // Mobile / default: full tabs
  return (
    <Box sx={{ width: "100%", maxWidth: 1040, mx: "auto", mt: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        centered
        TabIndicatorProps={{ style: { background: "#000", height: "1px" } }}
        sx={{
          "& .MuiTabs-flexContainer": {
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 10, sm: 20, md: 40 },
          },
          "& .MuiTab-root": {
            minWidth: 0,
            opacity: 0.6,
            py: 1,
            "&.Mui-selected": { opacity: 1 },
          },
        }}
      >
        <Tab icon={<GridOnIcon sx={{ fontSize: 26 }} />} />
        <Tab icon={<CalendarMonthIcon sx={{ fontSize: 26 }} />} />
      </Tabs>

      <CustomTabPanel value={value} index={0}>
        <PostGrid />
      </CustomTabPanel>

      <CustomTabPanel value={value} index={1}>
        <CalendarStreak />
      </CustomTabPanel>
    </Box>
  );
}