import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import L from "leaflet";

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const Map = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  const mapRef = useRef();
  const navigate = useNavigate();

  // Detect & center map on user’s current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          alert("Unable to fetch your location 😢. Check browser permissions.");
        }
      );
    }
  }, []);

  // Fetch route from OSRM
  const fetchRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]);
        setRouteCoords(coords);
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(1) + " km",
          duration: Math.round(route.duration / 60) + " min",
        });
      }
    } catch (err) {
      console.error("Routing error:", err);
    }
  };

  const handleMapClick = (latlng) => {
    setDestination([latlng.lat, latlng.lng]);
    if (userLocation) fetchRoute(userLocation, [latlng.lat, latlng.lng]);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* ✅ Floating Back Button (doesn't push layout, stays inside map zone) */}
      <button
        onClick={() => navigate("/profile")}
        className="absolute top-10 left-4 z-[1000] flex items-center gap-2 bg-white/90 hover:bg-white px-3 py-2 rounded-full shadow-lg border border-gray-200 transition-all"
      >
        <FaArrowLeft className="text-black" />
        <span className="font-semibold text-sm text-black">Back</span>
      </button>

      {/* 👇 Map container fills full viewport minus navbar height (64px) */}
      <div className="h-[calc(100vh-64px)] w-full">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
            L.control.zoom({ position: "bottomright" }).addTo(mapInstance);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {userLocation && (
            <Marker position={userLocation}>
              <Popup>📍 You are here</Popup>
            </Marker>
          )}

          {destination && (
            <Marker position={destination}>
              <Popup>🎯 Destination</Popup>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="blue" />
          )}
        </MapContainer>
      </div>

      {routeInfo && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/90 p-3 rounded-full shadow-md px-6 text-center">
          <p className="text-sm font-semibold">🚗 {routeInfo.distance}</p>
          <p className="text-sm font-semibold">⏱ {routeInfo.duration}</p>
        </div>
      )}
    </div>
  );
};

export default Map;