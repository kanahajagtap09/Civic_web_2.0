import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaLocationArrow, FaMapMarkerAlt } from "react-icons/fa";
import L from "leaflet";

// Marker images
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom user icon
const userIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMDA3QkZGIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjMDA3QkZGIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom destination icon
const destinationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkY0NDU4Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PC9zdmc+",
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
});

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
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef();
  const navigate = useNavigate();

  // Detect & center map on user
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          setIsLoading(false);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setIsLoading(false);
          const fallback = [40.7128, -74.006]; // NYC
          setUserLocation(fallback);
          if (mapRef.current) {
            mapRef.current.setView(fallback, 13);
          }
        }
      );
    }
  }, []);

  // Fetch route using OSRM
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

  const recenterMap = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation, 15);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-100">
      <div className="h-full w-full md:h-screen">
        <div className="relative h-[calc(100vh-128px)] md:h-full w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <MapContainer
              center={userLocation || [40.7128, -74.006]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              ref={mapRef}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                maxZoom={19}
              />

              <MapClickHandler onMapClick={handleMapClick} />

              {userLocation && (
                <>
                  <CircleMarker
                    center={userLocation}
                    radius={20}
                    fillColor="#007BFF"
                    fillOpacity={0.2}
                    stroke={false}
                    className="animate-pulse"
                  />
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup>
                      <div className="text-center">
                        <FaLocationArrow className="text-blue-600 mx-auto mb-1" />
                        <p className="font-semibold">You are here</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {destination && (
                <Marker position={destination} icon={destinationIcon}>
                  <Popup>
                    <div className="text-center">
                      <FaMapMarkerAlt className="text-red-600 mx-auto mb-1" />
                      <p className="font-semibold">Destination</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {routeCoords.length > 0 && (
                <>
                  <Polyline
                    positions={routeCoords}
                    color="black"
                    weight={8}
                    opacity={0.15}
                  />
                  <Polyline
                    positions={routeCoords}
                    color="#4285F4"
                    weight={6}
                    opacity={0.8}
                  />
                </>
              )}
            </MapContainer>
          )}

          {/* Floating Controls (moved down to clear nav) */}
          <div className="absolute top-20 left-4 right-4 z-[1000] flex justify-between items-center">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
            >
              <FaArrowLeft className="text-gray-700" />
              <span className="font-medium text-sm text-gray-700 hidden sm:inline">
                Back
              </span>
            </button>

            <button
              onClick={recenterMap}
              className="bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
              title="Center on my location"
            >
              <FaLocationArrow className="text-blue-600" />
            </button>
          </div>

          {/* Route Info Card */}
          {routeInfo && (
            <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto">
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 backdrop-blur-sm bg-opacity-95">
                <div className="flex items-center justify-around gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Distance
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {routeInfo.distance}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Duration
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {routeInfo.duration}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!destination && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 z-[999]">
              <div className="bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                <p className="text-sm text-gray-600">
                  Tap on the map to set destination
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;