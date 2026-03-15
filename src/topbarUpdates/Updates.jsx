// src/topbarUpdates/Updates.jsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon,
} from "@heroicons/react/24/solid";
import { MegaphoneIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

// ──────────────────────────────────────────────
// Status config
// ──────────────────────────────────────────────
const STATUS_CONFIG = {
  verifying: {
    label: "Verifying",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
    icon: <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />,
  },
  forwarding: {
    label: "Forwarding",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-400",
    icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-400",
    icon: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
  },
  assigned: {
    label: "Assigned",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-400",
    icon: <WrenchScrewdriverIcon className="w-5 h-5 text-blue-500" />,
  },
  "working progress": {
    label: "Working Progress",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-400",
    icon: <WrenchScrewdriverIcon className="w-5 h-5 text-violet-500" />,
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
    icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
  },
  accepted: {
    label: "Accepted",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-400",
    icon: <CheckCircleIcon className="w-5 h-5 text-teal-500" />,
  },
  escalated: {
    label: "Escalated",
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
    icon: <LockClosedIcon className="w-5 h-5 text-gray-400" />,
  },
};

const getStatus = (raw = "") => {
  const key = raw.toLowerCase().trim();
  if (key === "pending") return STATUS_CONFIG["verifying"];
  return STATUS_CONFIG[key] || STATUS_CONFIG["verifying"];
};

// ──────────────────────────────────────────────
// Demo fallback data
// ──────────────────────────────────────────────
const DEMO_POSTS = [
  {
    id: "demo-1",
    description: "Large pothole on Main Street causing traffic disruption near the central market crossing. Vehicles at risk.",
    tags: ["#pothole", "#roadDamage", "#urgent"],
    status: "working progress",
    geoData: { city: "Mumbai", region: "Maharashtra" },
    createdAt: { toDate: () => new Date(Date.now() - 2 * 3600000) },
    userId: "demo",
  },
  {
    id: "demo-2",
    description: "Garbage accumulation in residential area causing health hazards. Multiple complaints already filed.",
    tags: ["#garbage", "#sanitation", "#health"],
    status: "verifying",
    geoData: { city: "Pune", region: "Maharashtra" },
    createdAt: { toDate: () => new Date(Date.now() - 5 * 3600000) },
    userId: "demo",
  },
  {
    id: "demo-3",
    description: "Street light on Brigade Road completely non-functional for over two weeks. Safety concern at night.",
    tags: ["#streetLight", "#safety", "#night"],
    status: "assigned",
    geoData: { city: "Bangalore", region: "Karnataka" },
    createdAt: { toDate: () => new Date(Date.now() - 24 * 3600000) },
    userId: "demo",
  },
  {
    id: "demo-4",
    description: "Water logging issue resolved after drainage repair near Sector 21 park area.",
    tags: ["#waterLogging", "#drainage", "#resolved"],
    status: "completed",
    geoData: { city: "Noida", region: "UP" },
    createdAt: { toDate: () => new Date(Date.now() - 48 * 3600000) },
    userId: "demo",
  },
];

const FILTER_OPTIONS = ["All", "Verifying", "Forwarding", "Rejected", "Assigned", "Working Progress", "Completed", "Accepted", "Escalated"];

const statusFilterMap = {
  All: null,
  Verifying: ["verifying", "pending"],
  Forwarding: "forwarding",
  Rejected: "rejected",
  Assigned: "assigned",
  "Working Progress": "working progress",
  Completed: "completed",
  Accepted: "accepted",
  Escalated: "escalated",
};

// ──────────────────────────────────────────────
// PostCard component
// ──────────────────────────────────────────────
function PostCard({ post, isFirst }) {
  const statusCfg = getStatus(post.status);
  const timeAgo = useMemo(() => {
    try {
      const d = post.createdAt?.toDate?.();
      return d ? formatDistanceToNow(d, { addSuffix: true }) : "Recently";
    } catch {
      return "Recently";
    }
  }, [post.createdAt]);

  const shortDesc = post.description?.length > 100
    ? post.description.substring(0, 100) + "…"
    : post.description || "No description provided";

  const location = post.geoData
    ? [post.geoData.city, post.geoData.region].filter(Boolean).join(", ")
    : "Location unknown";

  return (
    <Link
      to={`/details/${post.id}`}
      className="group flex gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-200 relative overflow-hidden"
    >
      {/* Accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${statusCfg.dot}`} />

      {/* Icon */}
      <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${statusCfg.bg} border ${statusCfg.border} relative shadow-sm ml-1`}>
        {statusCfg.icon}
        {isFirst && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 shadow animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{shortDesc}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-3 h-3 text-gray-300" />
            {location}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3 text-gray-300" />
            {timeAgo}
          </span>
          <span className="text-gray-300">#{post.id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0 flex flex-col items-end justify-between">
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border} whitespace-nowrap`}>
          {statusCfg.label}
        </span>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────
// Main Updates component
// ──────────────────────────────────────────────
export default function Updates() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const initialFilter = location.state?.filter || "All";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [usingDemo, setUsingDemo] = useState(false);

  // ── Real-time Firestore listener - Filter by current user ──
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Query only posts by the current user
    const q = query(
      collection(db, "posts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setPosts(DEMO_POSTS);
          setUsingDemo(true);
        } else {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setPosts(data);
          setUsingDemo(false);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setPosts(DEMO_POSTS);
        setUsingDemo(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // ── Filtered posts ──
  const filtered = useMemo(() => {
    let result = [...posts];

    // Status filter
    const statusKey = statusFilterMap[activeFilter];
    if (statusKey) {
      if (Array.isArray(statusKey)) {
        result = result.filter((p) => statusKey.includes(p.status?.toLowerCase().trim()));
      } else {
        result = result.filter((p) => p.status?.toLowerCase().trim() === statusKey);
      }
    }

    // Text search
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((p) => {
        const inDesc = p.description?.toLowerCase().includes(q);
        const inTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const inCity = p.geoData?.city?.toLowerCase().includes(q);
        const inRegion = p.geoData?.region?.toLowerCase().includes(q);
        return inDesc || inTags || inCity || inRegion;
      });
    }

    return result;
  }, [posts, search, activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        {/* Main bar */}
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <MegaphoneIcon className="w-5 h-5 text-[#782048]" />
            <h1 className="text-base font-bold text-gray-900 tracking-tight">
              Issue Updates
            </h1>
          </div>

          {/* Empty div for right side balance */}
          <div className="w-9"></div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by description, tags, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150
                ${activeFilter === f
                  ? "bg-[#782048] text-white border-[#782048] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Demo badge ── */}
      {usingDemo && !loading && (
        <div className="mx-4 mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
          <ExclamationCircleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
          Showing demo data — you haven't reported any issues yet.
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-4 pt-4 pb-8">
        {loading ? (
          // Skeleton cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-5/6" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/6" />
                  <div className="h-3 bg-gray-100 rounded-full w-2/6" />
                </div>
                <div className="w-16 h-6 bg-gray-100 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No issues found</p>
            <p className="text-gray-400 text-sm mt-1">Your reported issues will appear here</p>
            <button
              onClick={() => { setSearch(""); setActiveFilter("All"); }}
              className="mt-4 text-sm text-[#782048] font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 font-medium pb-2">
              {filtered.length} issue{filtered.length !== 1 ? "s" : ""} {activeFilter !== "All" ? `• ${activeFilter}` : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((post, i) => (
                <PostCard key={post.id} post={post} isFirst={i === 0} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}