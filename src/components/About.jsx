import React, { useEffect, useState } from "react";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  subDays,
  isAfter,
  startOfMonth,
} from "date-fns";

// ----------------- Instagram-Style Notification Component -----------------
export default function Notification() {
  const [notifications, setNotifications] = useState([]);

  // 🔹 Demo users
  const demoUsers = [
    {
      id: "u1",
      username: "alex_harrison",
      photoURL:
        "https://www.morganstanley.com/content/dam/msdotcom/people/tiles/isaiah-dwuma.jpg.img.380.medium.jpg/1594668408164.jpg",
    },
    {
      id: "u2",
      username: "sophia_lee",
      photoURL:
        "https://img.freepik.com/free-photo/selfie-portrait-videocall_23-2149186122.jpg?semt=ais_hybrid&w=740&q=80",
    },
    {
      id: "u3",
      username: "daniel_williams",
      photoURL:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZSUyMGltYWdlfGVufDB8fDB8fHww",
    },
    {
      id: "u4",
      username: "miranda_clark",
      photoURL:
        "https://media.istockphoto.com/id/1452895487/photo/portrait-of-a-charming-business-woman-in-the-office.jpg?s=612x612&w=0&k=20&c=fZAe285E2Tq-9dtvSygGZe90NTRK8LN4cGqTrAmKmEo=",
    },
  ];

  // 🔹 Demo notifications
  useEffect(() => {
    const demoNotifications = [
      {
        id: "1",
        user: demoUsers[0],
        type: "like",
        createdAt: new Date(),
        postImage: "https://placekitten.com/210/210",
      },
      {
        id: "2",
        user: demoUsers[1],
        type: "follow",
        createdAt: subDays(new Date(), 1),
      },
      {
        id: "3",
        user: demoUsers[2],
        type: "comment",
        createdAt: subDays(new Date(), 2),
        commentPreview: "This design looks perfect 👌",
        postImage: "https://placekitten.com/250/250",
      },
      {
        id: "4",
        user: demoUsers[3],
        type: "mention",
        createdAt: subDays(new Date(), 3),
        commentPreview: "@alex_harrison check this one 🔥",
      },
      {
        id: "5",
        user: demoUsers[1],
        type: "comment",
        createdAt: subDays(new Date(), 5),
        commentPreview: "So professional and elegant ✨",
       
      },
      {
        id: "6",
        user: demoUsers[2],
        type: "follow",
        createdAt: subDays(new Date(), 12),
      },
    ];
    setNotifications(demoNotifications);
  }, []);

  // 🔹 Group notifications
  const grouped = {
    Today: [],
    Yesterday: [],
    "This week": [],
    "This month": [],
  };

  notifications.forEach((n) => {
    if (isToday(n.createdAt)) {
      grouped.Today.push(n);
    } else if (isYesterday(n.createdAt)) {
      grouped.Yesterday.push(n);
    } else if (isAfter(n.createdAt, subDays(new Date(), 7))) {
      grouped["This week"].push(n);
    } else if (isAfter(n.createdAt, startOfMonth(new Date()))) {
      grouped["This month"].push(n);
    }
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* 🔹 Header */}
      <div className="sticky top-0 bg-white border-b py-3 text-center font-semibold text-lg">
        Notifications
      </div>

      {/* 🔹 Content */}
      <div className="px-3 py-4 space-y-5">
        {Object.entries(grouped).map(([label, items]) =>
          items.length > 0 ? (
            <div key={label}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                {label}
              </h3>

              <div className="space-y-4">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between gap-3 hover:bg-gray-50 transition duration-150 p-2 rounded-lg"
                  >
                    {/* Avatar + Text */}
                    <div className="flex items-start gap-3">
                      <img
                        src={n.user?.photoURL}
                        className="w-11 h-11 rounded-full object-cover"
                        alt="profile"
                      />
                      <div>
                        <p className="text-sm leading-snug">
                          <span className="font-medium">
                            {n.user?.username}
                          </span>{" "}
                          {n.type === "like" && "liked your post"}
                          {n.type === "comment" && (
                            <>
                              commented:{" "}
                              <span className="text-gray-600 italic">
                                “{n.commentPreview}”
                              </span>
                            </>
                          )}
                          {n.type === "follow" && "started following you"}
                          {n.type === "mention" && (
                            <>
                              mentioned you:{" "}
                              <span className="text-gray-600 italic">
                                “{n.commentPreview}”
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Right side: image / button */}
                    <div>
                      

                      {n.type === "follow" && (
                        <button className="bg-blue-500 text-white text-xs px-4 py-1 rounded font-medium hover:bg-blue-600 transition">
                          Follow
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}