"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { LocationPreset } from "@/types/app"
import { Geofence } from "@/hooks/useGeofences"
import GeofenceLayer from "./GeofenceLayer"
import { Crosshair } from "lucide-react"

// Fix for default marker icon in Leaflet
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Green marker for temporary location
const greenIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [31, 51], // 1.2x larger
  iconAnchor: [15, 51],
  popupAnchor: [1, -34],
  shadowSize: [51, 51],
  className: "green-marker",
})

// Waypoint icon generator
const createWaypointIcon = (number: number) =>
  L.divIcon({
    className: "custom-waypoint-marker",
    html: `<div style="
      width: 30px;
      height: 30px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

L.Marker.prototype.options.icon = defaultIcon

type ViewMode = "idle" | "creating-static" | "creating-route"

interface LocationConfigMapProps {
  geofences: Geofence[]
  presets: LocationPreset[]
  viewMode: ViewMode
  tempLocation: { lat: number; lng: number } | null
  routeWaypoints: Array<{ lat: number; lng: number }>
  mapCenter: [number, number]
  mapZoom: number
  onMapClick: (latlng: { lat: number; lng: number }) => void
  onMyLocation: (lat: number, lng: number) => void
}

// Map click handler component
function MapClickHandler({
  viewMode,
  onMapClick,
}: {
  viewMode: ViewMode
  onMapClick: (latlng: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(e) {
      if (viewMode === "creating-static" || viewMode === "creating-route") {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    },
  })

  return null
}

// Map view controller for geocoding navigation
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.5 })
  }, [center, zoom, map])

  return null
}

export default function LocationConfigMap({
  geofences,
  presets,
  viewMode,
  tempLocation,
  routeWaypoints,
  mapCenter,
  mapZoom,
  onMapClick,
  onMyLocation,
}: LocationConfigMapProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const mapClassName = viewMode !== "idle" ? "mode-creating" : "mode-idle"

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      position => {
        setIsGettingLocation(false)
        onMyLocation(position.coords.latitude, position.coords.longitude)
      },
      error => {
        setIsGettingLocation(false)
        console.error("Error getting location:", error)
        alert(`Unable to get your location: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="h-full w-full relative">
      {/* My Location Button */}
      <button
        onClick={handleMyLocation}
        disabled={isGettingLocation}
        className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Center map on my current location">
        <Crosshair className={`w-5 h-5 ${isGettingLocation ? "animate-spin" : ""}`} />
      </button>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{
          height: "100%",
          width: "100%",
          cursor: viewMode !== "idle" ? "crosshair" : "grab"
        }}
        zoomControl={true}
        className={mapClassName}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Geofences */}
        <GeofenceLayer geofences={geofences} />

        {/* Existing presets - static locations */}
        {presets
          .filter(p => p.type === "static")
          .map(preset => (
            <Marker
              key={preset.id}
              position={[preset.latitude!, preset.longitude!]}
              title={preset.name}
            />
          ))}

        {/* Existing presets - routes */}
        {presets
          .filter(p => p.type === "route" && p.waypoints && p.waypoints.length > 0)
          .map(preset => (
            <Polyline
              key={preset.id}
              positions={preset.waypoints!.map(wp => [wp.latitude, wp.longitude])}
              pathOptions={{
                color: "#10b981", // Green
                weight: 3,
                opacity: 0.5,
                dashArray: "10, 5", // Dashed
              }}
            />
          ))}

        {/* Temporary marker for creating static location */}
        {tempLocation && <Marker position={[tempLocation.lat, tempLocation.lng]} icon={greenIcon} />}

        {/* Route waypoints while creating */}
        {routeWaypoints.map((wp, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={[wp.lat, wp.lng]}
            icon={createWaypointIcon(index + 1)}
          />
        ))}

        {/* Route polyline preview while creating */}
        {routeWaypoints.length > 1 && (
          <Polyline
            positions={routeWaypoints.map(wp => [wp.lat, wp.lng])}
            pathOptions={{
              color: "#3b82f6", // Blue
              weight: 4,
              opacity: 0.5,
              dashArray: "5, 5", // Dashed to indicate "in progress"
            }}
          />
        )}

        {/* Map click handler */}
        <MapClickHandler viewMode={viewMode} onMapClick={onMapClick} />

        {/* Map view controller for geocoding */}
        <MapViewController center={mapCenter} zoom={mapZoom} />
      </MapContainer>
    </div>
  )
}
