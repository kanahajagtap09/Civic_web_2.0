import React, { useEffect, useState } from "react";
import { FaMedal, FaStar } from "react-icons/fa";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

// Levels
const LEVELS = [
  { level: 1, requiredPoints: 0 },
  { level: 2, requiredPoints: 6000 },
  { level: 3, requiredPoints: 12000 },
  { level: 4, requiredPoints: 20000 },
];

// Medal definitions
const medalsData = [
  { name: "Gold", key: "gold", color: "bg-yellow-400", text: "text-yellow-700" },
  { name: "Silver", key: "silver", color: "bg-gray-300", text: "text-gray-600" },
  { name: "Bronze", key: "bronze", color: "bg-orange-300", text: "text-orange-700" },
];

// Modal style
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 12,
  boxShadow: 24,
  p: 3,
  width: { xs: "90vw", sm: 400 },
  outline: "none",
};

const LevelCard = () => {
  const [points, setPoints] = useState(5200);
  const [medals, setMedals] = useState({ gold: 24, silver: 18, bronze: 11 });
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [open, setOpen] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedPoints = localStorage.getItem("userPoints");
    const savedMedals = localStorage.getItem("userMedals");
    if (savedPoints) setPoints(Number(savedPoints));
    if (savedMedals) setMedals(JSON.parse(savedMedals));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("userPoints", points);
    localStorage.setItem("userMedals", JSON.stringify(medals));
  }, [points, medals]);

  // Levels
  const currentLevel = LEVELS.reduce(
    (prev, lvl) => (points >= lvl.requiredPoints ? lvl : prev),
    LEVELS[0]
  );
  const nextLevel = LEVELS.find((lvl) => lvl.level === currentLevel.level + 1);

  const progressToNext = nextLevel
    ? ((points - currentLevel.requiredPoints) /
        (nextLevel.requiredPoints - currentLevel.requiredPoints)) *
      100
    : 100;

  // Animate progress bar from 0
  useEffect(() => {
    let start = 0;
    const animate = () => {
      start += 2;
      if (start >= progressToNext) {
        setAnimatedProgress(progressToNext);
        return;
      }
      setAnimatedProgress(start);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [progressToNext]);

  // Animate points counter
  useEffect(() => {
    let current = 0;
    const increment = Math.ceil(points / 50);
    const timer = setInterval(() => {
      current += increment;
      if (current >= points) {
        setAnimatedPoints(points);
        clearInterval(timer);
      } else {
        setAnimatedPoints(current);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [points]);

  return (
    <>
      {/* Main Card */}
      <div
        className="bg-white shadow-md rounded-2xl p-4 my-4 
                   cursor-pointer transition hover:shadow-lg"
        onClick={() => setOpen(true)}  // 👈 Makes card clickable
      >
        {/* Level Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white font-bold">
            {currentLevel.level}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">Level {currentLevel.level}</span>
            {nextLevel && (
              <span className="text-xs text-gray-500">
                {nextLevel.requiredPoints - points} Points to next level
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-3 border border-purple-400">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            style={{ width: `${animatedProgress}%` }}
          />
          <div className="absolute inset-0 flex justify-between items-center px-3 text-xs font-semibold text-black">
            <span>{currentLevel.level}</span>
            <span className="flex items-center gap-1">
              <FaStar className="text-yellow-600 text-xs" />
              {animatedPoints}/{nextLevel ? nextLevel.requiredPoints : points}
            </span>
            <span>{nextLevel ? nextLevel.level : "MAX"}</span>
          </div>
        </div>

        {/* Medals */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700">
            MEDALS {medals.gold + medals.silver + medals.bronze}
          </h3>
          <div className="flex gap-6">
            {medalsData.map((m) => (
              <div key={m.name} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 ${m.color} rounded-full shadow-md
                              flex items-center justify-center`}
                >
                  <FaMedal className={`text-lg ${m.text}`} />
                </div>
                <span className={`mt-1 text-sm font-semibold ${m.text}`}>
                  {m.name}
                </span>
                <span className="text-gray-700">{medals[m.key]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <h2 className="font-bold text-lg">Level {currentLevel.level} Details</h2>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <p className="text-gray-700 mb-3">
            You currently have <b>{points}</b> points.
          </p>
          {nextLevel ? (
            <p className="text-sm text-gray-600 mb-2">
              Only <b>{nextLevel.requiredPoints - points}</b> points left to reach Level{" "}
              <b>{nextLevel.level}</b> 🎯
            </p>
          ) : (
            <p className="text-sm text-green-600">🎉 You are at the maximum Level!</p>
          )}

          <h3 className="mt-3 font-semibold">Your Medals</h3>
          <div className="flex gap-6 mt-2">
            {medalsData.map((m) => (
              <div key={m.name} className="flex flex-col items-center">
                <div className={`w-10 h-10 ${m.color} rounded-full flex items-center justify-center shadow-md`}>
                  <FaMedal className={`text-lg ${m.text}`} />
                </div>
                <span className={`mt-1 text-sm font-semibold ${m.text}`}>
                  {m.name}
                </span>
                <span className="text-gray-700">{medals[m.key]}</span>
              </div>
            ))}
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default LevelCard;