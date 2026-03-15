// src/topbarUpdates/Details.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  UserGroupIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
  LockClosedIcon,
  StarIcon,
  BoltIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

// ─────────────────────────────────────────────
// Helpers / config
// ─────────────────────────────────────────────
const STATUS_MAP = {
  verifying: { label: "Verifying", color: "bg-amber-100 text-amber-700 border-amber-300", step: 0 },
  forwarding: { label: "Forwarding", color: "bg-green-100 text-green-700 border-green-300", step: 1 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-300", step: 1 },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-700 border-blue-300", step: 2 },
  "working progress": { label: "Working Progress", color: "bg-violet-100 text-violet-700 border-violet-300", step: 3 },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-300", step: 4 },
  accepted: { label: "Accepted", color: "bg-teal-100 text-teal-700 border-teal-300", step: 5 },
  escalated: { label: "Escalated", color: "bg-gray-100 text-gray-600 border-gray-300", step: 6 },
};

const PRIORITY_MAP = {
  high: { label: "High", color: "bg-red-100 text-red-700 border-red-300" },
  medium: { label: "Medium", color: "bg-orange-100 text-orange-700 border-orange-300" },
  low: { label: "Low", color: "bg-green-100 text-green-700 border-green-300" },
  urgent: { label: "Urgent", color: "bg-red-200 text-red-800 border-red-400 font-bold" },
};

const STATUS_STEPS = [
  { key: "verifying", label: "Verifying", icon: ExclamationCircleIcon },
  { key: "forwarding", label: "Forwarding", icon: CheckCircleIcon },
  { key: "assigned", label: "Assigned", icon: UserGroupIcon },
  { key: "working progress", label: "Working Progress", icon: WrenchScrewdriverIcon },
  { key: "completed", label: "Completed", icon: CheckCircleIcon },
];

function getStatusCfg(raw = "") {
  return STATUS_MAP[raw.toLowerCase().trim()] || STATUS_MAP["verifying"];
}

function fmtDate(val) {
  try {
    const d = val?.toDate?.() || (val ? new Date(val) : null);
    if (!d || isNaN(d)) return "N/A";
    return format(d, "dd MMM yyyy, hh:mm a");
  } catch { return "N/A"; }
}

function timeAgo(val) {
  try {
    const d = val?.toDate?.() || (val ? new Date(val) : null);
    if (!d || isNaN(d)) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ""; }
}

// ─────────────────────────────────────────────
// Demo fallback data
// ─────────────────────────────────────────────
const DEMO_POST = {
  id: "DEMO-001",
  description: "A large pothole has formed on the main road near the central market junction, causing major traffic disruption and vehicle damage. Multiple complaints have been filed. Immediate repair is required as it poses a serious safety risk, especially during night hours.",
  tags: ["#pothole", "#roadDamage", "#urgent"],
  status: "working progress",
  geoData: { city: "Mumbai", region: "Maharashtra", address: "Near Central Market, MG Road", lat: 19.076, lng: 72.877 },
  createdAt: { toDate: () => new Date(Date.now() - 2 * 3600000) },
  userId: "demo-user",
  assignedTo: "Road Maintenance Division",
  teamLead: "Rajesh Kumar",
  contactPhone: "+91 98765 43210",
  eta: "2026-02-27",
  priority: "high",
  rating: null,
  resolvedImageUrl: null,
  history: [
    { status: "Issue Reported", date: new Date(Date.now() - 2 * 3600000).toISOString(), note: "Citizen filed complaint via CIVIC app." },
    { status: "Reviewed by Admin", date: new Date(Date.now() - 1.5 * 3600000).toISOString(), note: "Complaint verified and forwarded to PWD." },
    { status: "Assigned to Crew", date: new Date(Date.now() - 1 * 3600000).toISOString(), note: "Field team dispatched to the location." },
    { status: "Work in Progress", date: new Date(Date.now() - 0.5 * 3600000).toISOString(), note: "Repair work started on site." },
  ],
};

const DEMO_USER = {
  name: "Citizen Reporter",
  username: "citizen_reporterX",
  profileImage: null,
  userRole: "User",
};

// ─────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────

function SectionCard({ title, icon: Icon, iconColor = "text-gray-500", children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <div className={`p-1.5 rounded-lg bg-gray-50 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-gray-800 tracking-wide uppercase">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 sm:w-36 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium ${highlight || "text-gray-700"}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = priority?.toLowerCase() || "medium";
  const cfg = PRIORITY_MAP[p] || PRIORITY_MAP.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <BoltIcon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StepperTimeline({ post }) {
  const statusCfg = getStatusCfg(post.status);
  const currentStep = statusCfg.step ?? 0;

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentStep;
        const isCurrent = idx === currentStep;
        const IconComp = step.icon;

        // Try to match history entries
        const histEntry = post.history?.find(h =>
          h.status?.toLowerCase().includes(step.label.toLowerCase().split(" ")[0])
        );

        return (
          <div key={step.key} className="flex gap-3">
            {/* Indicator column */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300
                ${isCompleted
                  ? isCurrent
                    ? "bg-[#782048] border-[#782048] text-white shadow-md shadow-[#782048]/20"
                    : "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-gray-100 border-gray-200 text-gray-300"
                }`}>
                <IconComp className="w-4 h-4" />
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-10 mt-0.5 ${isCompleted && idx < currentStep ? "bg-emerald-400" : "bg-gray-100"}`} />
              )}
            </div>

            {/* Text column */}
            <div className="pb-8 flex-1">
              <p className={`text-sm font-semibold ${isCompleted ? (isCurrent ? "text-[#782048]" : "text-gray-700") : "text-gray-300"}`}>
                {step.label}
              </p>
              {histEntry && (
                <p className="text-xs text-gray-400 mt-0.5">{histEntry.note || ""}</p>
              )}
              {histEntry?.date && (
                <p className="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {fmtDate(histEntry.date)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FullHistoryTimeline({ post }) {
  const entries = useMemo(() => {
    if (post.history && post.history.length > 0) return post.history;
    // Synthesize from status + createdAt
    const generated = [];
    generated.push({ status: "Issue Reported", date: post.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(), note: "Complaint filed via CIVIC." });
    if (["forwarding", "assigned", "working progress", "completed", "accepted"].includes(post.status?.toLowerCase())) {
      const d = new Date((post.createdAt?.toDate?.() || new Date()).getTime() + 30 * 60000);
      generated.push({ status: "Under Review", date: d.toISOString(), note: "Admin acknowledged the report." });
    }
    if (["working progress", "completed", "accepted"].includes(post.status?.toLowerCase())) {
      const d = new Date((post.createdAt?.toDate?.() || new Date()).getTime() + 60 * 60000);
      generated.push({ status: "Work Assigned", date: d.toISOString(), note: "Field team dispatched." });
    }
    if (["completed", "accepted"].includes(post.status?.toLowerCase())) {
      const d = new Date((post.createdAt?.toDate?.() || new Date()).getTime() + 120 * 60000);
      generated.push({ status: "Issue Completed", date: d.toISOString(), note: "Repair completed and verified." });
    }
    return generated;
  }, [post]);

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3 relative">
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-[#782048]" : "bg-gray-300"}`} />
            {i < entries.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
          </div>
          <div className={`pb-3 ${i < entries.length - 1 ? "" : ""}`}>
            <p className="text-xs font-semibold text-gray-700">{entry.status}</p>
            {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
            <p className="text-[10px] text-gray-300 mt-0.5">
              {fmtDate(entry.date || entry.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating, onRate, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || rating || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          disabled={readOnly}
          onClick={() => !readOnly && onRate?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`transition-transform duration-100 ${!readOnly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          {star <= display
            ? <StarIcon className="w-5 h-5 text-yellow-400" />
            : <StarOutline className="w-5 h-5 text-gray-300" />
          }
        </button>
      ))}
      {rating && <span className="ml-2 text-sm font-semibold text-gray-600">{rating}/5</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Details component
// ─────────────────────────────────────────────
export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [reporter, setReporter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [solvedImgError, setSolvedImgError] = useState(false);

  // ── Fetch post ──
  useEffect(() => {
    if (!id || id === "DEMO-001") {
      setPost(DEMO_POST);
      setReporter(DEMO_USER);
      setUsingDemo(true);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "posts", id),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setPost(data);
          setUserRating(data.rating || null);
          setUsingDemo(false);
        } else {
          setPost({ ...DEMO_POST, id });
          setReporter(DEMO_USER);
          setUsingDemo(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setPost({ ...DEMO_POST, id });
        setReporter(DEMO_USER);
        setUsingDemo(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  // ── Fetch reporter user ──
  useEffect(() => {
    if (!post?.userId || post.userId === "demo-user") return;
    const unsub = onSnapshot(doc(db, "users", post.userId), (snap) => {
      if (snap.exists()) setReporter({ id: snap.id, ...snap.data() });
      else setReporter(DEMO_USER);
    });
    return () => unsub();
  }, [post?.userId]);

  const statusCfg = getStatusCfg(post?.status);
  const isResolved = ["completed", "accepted"].includes(post?.status?.toLowerCase());

  const locationStr = useMemo(() => {
    if (!post?.geoData) return "Unknown location";
    return [post.geoData.address, post.geoData.city, post.geoData.region]
      .filter(Boolean).join(", ");
  }, [post?.geoData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#782048]/30 border-t-[#782048] rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading issue details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4 text-[#782048]" />
            <span className="text-sm font-bold text-gray-900">
              Issue #{(post?.id || "").slice(0, 8).toUpperCase()}
            </span>
            <StatusBadge status={post?.status} />
          </div>

          <div className="w-9" />
        </div>

        {usingDemo && (
          <div className="mx-4 mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
            <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            Showing demo data — real post not found.
          </div>
        )}
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 max-w-7xl mx-auto lg:h-[calc(100vh-56px)] lg:overflow-hidden">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* ════════════════════════ LEFT COLUMN (2/3) ════════════════════════ */}
        <div
          className="lg:col-span-2 space-y-4 lg:overflow-y-auto lg:pb-20 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >

          {/* OVERVIEW */}
          <SectionCard title="Overview" icon={DocumentTextIcon} iconColor="text-[#782048]">
            {/* Reporter row */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#782048] to-[#a03060] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {reporter?.profileImage
                  ? <img src={reporter.profileImage} alt="" className="w-full h-full object-cover" />
                  : (reporter?.username?.[0]?.toUpperCase() || "U")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {reporter?.name || reporter?.username || "Unknown User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {reporter?.userRole === "Department" && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full">
                      <ShieldCheckIcon className="w-3 h-3" /> Verified
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{timeAgo(post?.createdAt)}</span>
                </div>
              </div>
              <PriorityBadge priority={post?.priority || "medium"} />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {post?.description || "No description provided."}
            </p>

            {/* Tags */}
            {post?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium">
                    <TagIcon className="w-3 h-3" />
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            <InfoRow label="Location" value={locationStr} />
            <InfoRow label="Reported" value={fmtDate(post?.createdAt)} />
            <InfoRow label="Status" value={<StatusBadge status={post?.status} />} />
          </SectionCard>

          {/* ASSIGNED TO */}
          <SectionCard title="Assigned To" icon={UserGroupIcon} iconColor="text-blue-500">
            <InfoRow
              label="Department"
              value={post?.assignedTo || "Public Works Department"}
              highlight="text-gray-800 font-semibold"
            />
            <InfoRow
              label="Team Lead"
              value={post?.teamLead || "Rajesh Kumar"}
            />
            <InfoRow
              label="Contact"
              value={
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                  {post?.contactPhone || "+91 98765 43210"}
                </span>
              }
            />
            <InfoRow
              label="ETA"
              value={
                post?.eta
                  ? fmtDate(post.eta)
                  : "2026-02-27 (estimated)"
              }
              highlight="text-violet-700"
            />
            <InfoRow
              label="Assigned On"
              value={fmtDate(post?.assignedAt || post?.createdAt)}
            />
          </SectionCard>

          {/* UPDATE HISTORY — Stepper */}
          <SectionCard title="Update History" icon={ClockIcon} iconColor="text-violet-500">
            <StepperTimeline post={post} />
          </SectionCard>
        </div>

        {/* ════════════════════════ RIGHT COLUMN (1/3) ════════════════════════ */}
        <div
          className="space-y-4 lg:overflow-y-auto lg:pb-20 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >

          {/* ISSUE IMAGE */}
          <SectionCard title="Issue Image" icon={PhotoIcon} iconColor="text-gray-500">
            <div className="rounded-xl overflow-hidden bg-gray-100 aspect-[4/3] relative">
              {post?.imageUrl && !imgError ? (
                <img
                  src={post.imageUrl}
                  alt="Reported issue"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                  <PhotoIcon className="w-10 h-10" />
                  <p className="text-xs">No image available</p>
                </div>
              )}
            </div>
            {post?.geoData && (
              <div className="flex items-start gap-1.5 mt-3">
                <MapPinIcon className="w-3.5 h-3.5 text-[#782048] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-snug">{locationStr}</p>
              </div>
            )}
          </SectionCard>

          {/* SOLVE ISSUE IMAGE + RATING */}
          <SectionCard title="Resolved Image & Rating" icon={CheckCircleIcon} iconColor="text-emerald-500">
            {/* Resolved image */}
            <div className="rounded-xl overflow-hidden bg-gray-50 aspect-[4/3] relative border border-dashed border-gray-200 mb-4">
              {post?.resolvedImageUrl && !solvedImgError ? (
                <img
                  src={post.resolvedImageUrl}
                  alt="Resolved issue"
                  className="w-full h-full object-cover"
                  onError={() => setSolvedImgError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                  {isResolved
                    ? <CheckCircleIcon className="w-10 h-10 text-emerald-300" />
                    : <WrenchScrewdriverIcon className="w-10 h-10" />
                  }
                  <p className="text-xs text-center px-4">
                    {isResolved
                      ? "Resolution photo not uploaded yet"
                      : "Available after issue resolution"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Rating */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {post?.rating ? "Community Rating" : "Rate this resolution"}
              </p>
              <StarRating
                rating={userRating}
                readOnly={!!post?.rating}
                onRate={(star) => {
                  setUserRating(star);
                  // TODO: write to Firestore post.rating
                }}
              />
              {!post?.rating && !userRating && (
                <p className="text-[10px] text-gray-300 mt-2">
                  {isResolved ? "Share your feedback on the resolution quality." : "Rating available once resolved."}
                </p>
              )}
              {userRating && !post?.rating && (
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  Thank you for your feedback! ⭐
                </p>
              )}
            </div>
          </SectionCard>

          {/* LOGS / ACTIVITY */}
          <SectionCard title="Activity Log" icon={BoltIcon} iconColor="text-orange-500">
            <FullHistoryTimeline post={post} />
          </SectionCard>

        </div>
      </div>
    </div>
  );
}