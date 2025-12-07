"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { calculateHeading } from "@/lib/locationUtils"

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

L.Marker.prototype.options.icon = defaultIcon

// Component to handle map updates
function MapUpdater({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap()

  useEffect(() => {
    // Update map view smoothly on every position change
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true, duration: 0.2 })
  }, [position, map])

  return null
}

export default function MapPanel() {
  const { effectiveLocation, locationOverride, setLocationOverrideConfig } = usePhone()

  const currentPosition = effectiveLocation
    ? {
        lat: effectiveLocation.coords.latitude,
        lng: effectiveLocation.coords.longitude,
      }
    : null

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
        <h2 className="text-xl font-bold">Location Viewer</h2>
        <p className="text-sm text-green-100 mt-1">Real-time tracking</p>
      </div>

      {/* Content */}
      {effectiveLocation && currentPosition ? (
        <div className="flex-1 flex flex-col">
          {/* Map */}
          <div className="flex-1 relative bg-gray-100">
            <MapContainer
              center={[currentPosition.lat, currentPosition.lng]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[currentPosition.lat, currentPosition.lng]} />
              <MapUpdater position={currentPosition} />
            </MapContainer>
          </div>

          {/* Info Panel */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Latitude</div>
                <div className="font-mono text-gray-800">{effectiveLocation.coords.latitude.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Longitude</div>
                <div className="font-mono text-gray-800">{effectiveLocation.coords.longitude.toFixed(6)}</div>
              </div>
              {effectiveLocation.coords.accuracy !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Accuracy</div>
                  <div className="text-gray-800">±{Math.round(effectiveLocation.coords.accuracy)}m</div>
                </div>
              )}
              {effectiveLocation.coords.speed !== null && effectiveLocation.coords.speed !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Speed</div>
                  <div className="text-gray-800">
                    {effectiveLocation.coords.speed.toFixed(1)} m/s
                    <span className="text-gray-500 ml-1">({(effectiveLocation.coords.speed * 2.237).toFixed(1)} mph)</span>
                  </div>
                </div>
              )}
              {effectiveLocation.coords.heading !== null && effectiveLocation.coords.heading !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Heading</div>
                  <div className="text-gray-800">{Math.round(effectiveLocation.coords.heading)}°</div>
                </div>
              )}
              {effectiveLocation.coords.altitude !== null && effectiveLocation.coords.altitude !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Altitude</div>
                  <div className="text-gray-800">{Math.round(effectiveLocation.coords.altitude)}m</div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">Live tracking active</span>
            </div>

            {/* Route Controls */}
            {locationOverride.enabled && locationOverride.mode === "route" && locationOverride.route && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Route Progress</div>
                <div className="text-xs text-gray-600 mb-3">
                  Waypoint {locationOverride.route.currentWaypointIndex + 1} of{" "}
                  {locationOverride.route.waypoints.length}
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={() => {
                    setLocationOverrideConfig({
                      route: {
                        ...locationOverride.route!,
                        isPlaying: !locationOverride.route!.isPlaying,
                      },
                    })
                  }}
                  className="w-full mb-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {locationOverride.route.isPlaying ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Play
                    </>
                  )}
                </button>

                {/* Position Slider */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Position along route:</label>
                  <input
                    type="range"
                    min="0"
                    max={locationOverride.route.waypoints.length - 1}
                    step="0.01"
                    value={locationOverride.route.currentWaypointIndex + locationOverride.route.progress}
                    onChange={e => {
                      const value = parseFloat(e.target.value)
                      const waypointIndex = Math.floor(value)
                      const progress = value - waypointIndex

                      const route = locationOverride.route!
                      const currentWaypoint = route.waypoints[waypointIndex]
                      const nextWaypoint = route.waypoints[waypointIndex + 1]

                      if (currentWaypoint && nextWaypoint) {
                        // Calculate interpolated position
                        const lat = currentWaypoint.latitude + (nextWaypoint.latitude - currentWaypoint.latitude) * progress
                        const lon = currentWaypoint.longitude + (nextWaypoint.longitude - currentWaypoint.longitude) * progress
                        const heading = calculateHeading(currentWaypoint, nextWaypoint)
                        const speed = currentWaypoint.speed ?? nextWaypoint.speed ?? null

                        setLocationOverrideConfig({
                          route: {
                            ...route,
                            currentWaypointIndex: waypointIndex,
                            progress: progress,
                            isPlaying: false, // Pause when manually adjusting
                          },
                          staticPosition: {
                            latitude: lat,
                            longitude: lon,
                            accuracy: 10,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading,
                            speed,
                          },
                        })
                      } else {
                        // At the end of the route
                        setLocationOverrideConfig({
                          route: {
                            ...route,
                            currentWaypointIndex: waypointIndex,
                            progress: progress,
                            isPlaying: false,
                          },
                        })
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Start</span>
                    <span>End</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <p className="text-gray-600 font-medium mb-1">Waiting for location...</p>
            <p className="text-gray-500 text-sm">Enable location or select a preset</p>
          </div>
        </div>
      )}
    </div>
  )
}
