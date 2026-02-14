import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaLocationArrow, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import L from "leaflet";
import { db } from "../firebase/firebase";
import { collection, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";

// Fix leaflet default markers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// User location icon
const userPulsingIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-6 h-6">
           <div class="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75"></div>
           <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
         </div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Avatar Icon for Posts
const createAvatarIcon = (url, count = null) => {
  const badge = count > 1 ? `<div class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">${count}</div>` : '';

  return L.divIcon({
    html: `<div class="relative">
             <div class="w-12 h-12 rounded-full border-3 border-white shadow-xl overflow-hidden transform transition-transform hover:scale-110 bg-white">
               <img src="${url}" class="w-full h-full object-cover" onerror="this.src='/default-avatar.png'" />
             </div>
             ${badge}
           </div>`,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

// Distance calculation (Haversine formula)
const getDistance = (coord1, coord2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Cluster posts by proximity
const clusterPosts = (posts) => {
  const clusters = [];
  const used = new Set();

  posts.forEach((post, i) => {
    if (used.has(i)) return;

    const nearby = [];
    posts.forEach((p, j) => {
      if (i === j || used.has(j)) return;
      const distance = getDistance(post.geoData, p.geoData);
      if (distance < 100) { // 100 meters radius
        nearby.push({ ...p, index: j });
        used.add(j);
      }
    });

    if (nearby.length > 0) {
      clusters.push({ main: post, posts: [post, ...nearby.map(n => n)] });
      used.add(i);
    } else {
      clusters.push({ main: post, posts: [post] });
      used.add(i);
    }
  });

  return clusters;
};

// Helper functions
const getUserData = async (userId) => {
  if (!userId) return { username: "Unknown", photoURL: "/default-avatar.png" };
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        username: data.username || data.name || "Unknown",
        photoURL: data.profileImage || "/default-avatar.png",
      };
    }
  } catch (err) {
    console.error(err);
  }
  return { username: "Unknown", photoURL: "/default-avatar.png" };
};

const resolvePhoto = (val) => {
  if (!val) return "/default-avatar.png";
  if (val.startsWith("http") || val.startsWith("data:")) return val;
  return `data:image/jpeg;base64,${val}`;
};

const Map = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef();
  const navigate = useNavigate();
  const userCache = useRef({});

  // Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          setLoading(false);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLoading(false);
          const fallback = [19.076, 72.8777]; // Mumbai
          setUserLocation(fallback);
        }
      );
    }
  }, []);

  // Fetch Posts with GeoData
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const geoPosts = rawPosts.filter(
        (p) => p.geoData && p.geoData.latitude && p.geoData.longitude
      );

      const enriched = await Promise.all(
        geoPosts.map(async (p) => {
          const uid = p.userId || p.uid;
          if (!userCache.current[uid]) {
            userCache.current[uid] = await getUserData(uid);
          }
          const user = userCache.current[uid];
          return {
            ...p,
            user: { ...user, photoURL: resolvePhoto(user.photoURL) },
            imageUrl: resolvePhoto(p.imageUrl || p.image),
          };
        })
      );

      setPosts(enriched);
      const clustered = clusterPosts(enriched);
      setClusters(clustered);
    });

    return () => unsubscribe();
  }, []);

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation, 15, { animate: true });
    }
  };

  const handleClusterClick = (cluster) => {
    if (cluster.posts.length > 1) {
      setSelectedCluster(cluster);
    } else {
      // Navigate to single post
      navigate(`/explore`);
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-100">
      {/* Navbar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <FaArrowLeft />
        </button>

        <div className="pointer-events-auto bg-white px-4 py-2 rounded-full shadow-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaMapMarkerAlt className="text-red-500" />
          <span>Civic Map</span>
        </div>

        <div className="w-10"></div>
      </div>

      <MapContainer
        center={userLocation || [20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100%", width: "100%", background: "#f3f4f6" }}
        zoomControl={false}
        ref={mapRef}
        className="z-0"
      >
        {/* Real Map Tiles - Standard OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* User Location */}
        {userLocation && (
          <Marker position={userLocation} icon={userPulsingIcon} zIndexOffset={1000}>
            <Popup closeButton={false} className="rounded-lg">
              <div className="text-center font-semibold text-sm p-1">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Post Clusters */}
        {clusters.map((cluster, idx) => (
          <Marker
            key={idx}
            position={[cluster.main.geoData.latitude, cluster.main.geoData.longitude]}
            icon={createAvatarIcon(cluster.main.user?.photoURL, cluster.posts.length)}
            eventHandlers={{
              click: () => handleClusterClick(cluster),
            }}
          >
            {cluster.posts.length === 1 && (
              <Popup className="rounded-xl p-0 border-none shadow-2xl" minWidth={220} closeButton={false}>
                <div className="flex flex-col w-[220px] overflow-hidden rounded-xl bg-white">
                  <div className="relative h-40 w-full bg-gray-200">
                    <img
                      src={cluster.main.imageUrl}
                      className="w-full h-full object-cover"
                      alt="Post"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={cluster.main.user?.photoURL}
                        className="w-7 h-7 rounded-full object-cover border"
                        alt=""
                      />
                      <span className="font-bold text-sm truncate">
                        {cluster.main.user?.username}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {cluster.main.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <FaMapMarkerAlt className="text-red-500" />
                      <span className="truncate">{cluster.main.geoData.city}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/explore`)}
                      className="w-full bg-blue-500 text-white text-xs py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                      View Post
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Recenter Button */}
      {userLocation && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-24 right-4 z-[1000] bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition transform hover:scale-105"
        >
          <FaLocationArrow />
        </button>
      )}

      {/* Sidebar for Multiple Posts */}
      {selectedCluster && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center md:justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full md:w-96 h-[70vh] md:h-full md:max-h-screen rounded-t-3xl md:rounded-none flex flex-col shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="font-bold text-lg">{selectedCluster.main.geoData.city}</h3>
                <p className="text-sm text-gray-500">{selectedCluster.posts.length} posts here</p>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-gray-600 hover:text-gray-800 p-2"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Post List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedCluster.posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => {
                    setSelectedCluster(null);
                    navigate(`/explore`);
                  }}
                  className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition"
                >
                  <img
                    src={post.imageUrl}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    alt="Post"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={post.user?.photoURL}
                        className="w-6 h-6 rounded-full object-cover"
                        alt=""
                      />
                      <span className="font-semibold text-sm truncate">
                        {post.user?.username}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {post.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;