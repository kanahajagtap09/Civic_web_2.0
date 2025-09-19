// src/components/Details.js
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";

const Details = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fake data (in real app this comes from API)
  const issue = {
    id,
    category: "Road Maintenance",
    type: "Pothole",
    status: "In Progress",
    priority: "Urgent",
    reportedDate: "2024-01-15 10:00 AM",
    assignedDate: "2024-01-16 2:00 PM",
    estimatedCompletion: "2024-01-17 5:00 PM",
    team: "Road Maintenance Crew 1",
    lead: "Liam Harper",
    history: [
      { status: "Issue Reported", date: "2024-01-15 10:00 AM" },
      { status: "Assigned to Crew", date: "2024-01-16 2:00 PM" },
      { status: "Work in Progress", date: "2024-01-16 3:00 PM" },
    ],
  };

  // Stepper config with icons
  const statusIcons = {
    "Issue Reported": <ExclamationTriangleIcon className="w-6 h-6" />,
    "Assigned to Crew": <UserGroupIcon className="w-6 h-6" />,
    "Work in Progress": <WrenchScrewdriverIcon className="w-6 h-6" />,
    Resolved: <CheckCircleIcon className="w-6 h-6" />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 border-b 
          bg-white/90 backdrop-blur-md shadow-sm h-16">
        <button onClick={() => navigate(-1)} className="text-gray-700">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Issue #{issue.id}</h1>
        <div className="w-6" /> {/* spacer */}
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* 🔹 Issue Info */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Overview</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Category:</strong> {issue.type} – {issue.category}</p>
            <p><strong>Status:</strong> 
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                {issue.status}
              </span>
            </p>
            <p><strong>Priority:</strong> 
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium">
                {issue.priority}
              </span>
            </p>
            <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-500"/> Reported: {issue.reportedDate}</p>
            <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-500"/> Assigned: {issue.assignedDate}</p>
            <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-500"/> ETA: {issue.estimatedCompletion}</p>
          </div>
        </div>

        {/* 🔹 Personnel */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Personnel</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="flex items-center gap-2"><UserGroupIcon className="w-5 h-5 text-gray-500"/> Team: {issue.team}</p>
            <p className="flex items-center gap-2"><UserIcon className="w-5 h-5 text-gray-500"/> Lead: {issue.lead}</p>
          </div>
        </div>

        {/* 🔹 Stepper History */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Update History</h2>
          <div className="relative pl-6">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            <ul className="space-y-6">
              {issue.history.map((h, idx) => (
                <li key={idx} className="relative flex items-start gap-3">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm">
                    {statusIcons[h.status] || <CheckCircleIcon className="w-6 h-6 text-gray-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{h.status}</p>
                    <p className="text-xs text-gray-500">{h.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;