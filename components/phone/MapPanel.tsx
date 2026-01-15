"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { calculateHeading } from "@/lib/locationUtils"
import { useGeofences } from "@/hooks/useGeofences"
import GeofenceLayer from "@/components/location-config/GeofenceLayer"

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

// Component to handle map updates and ensure proper sizing
function MapUpdater({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap()

  useEffect(() => {
    // Invalidate size on mount to ensure map renders correctly
    // This fixes issues when the container is initially hidden or has dynamic size
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])

  useEffect(() => {
    // Update map view smoothly on every position change
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true, duration: 0.2 })
  }, [position, map])

  return null
}

// Component to handle map clicks
function MapClickHandler({
  onLocationSet,
}: {
  onLocationSet: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onLocationSet(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Default location (San Francisco) when no location is available
const DEFAULT_POSITION = { lat: 37.7749, lng: -122.4194 }

export default function MapPanel() {
  const { effectiveLocation, locationOverride, setLocationOverrideConfig } = usePhone()
  const { geofences } = useGeofences()

  const currentPosition = effectiveLocation
    ? {
        lat: effectiveLocation.coords.latitude,
        lng: effectiveLocation.coords.longitude,
      }
    : null

  // Use current position or default for map center
  const mapCenter = currentPosition || DEFAULT_POSITION

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
        <h2 className="text-xl font-bold">Location Viewer</h2>
        <p className="text-sm text-green-100 mt-1">Click map to set location</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Map - always shown */}
        <div className="flex-1 relative bg-gray-100">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={currentPosition ? 16 : 12}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {currentPosition && <Marker position={[currentPosition.lat, currentPosition.lng]} />}
            <GeofenceLayer geofences={geofences} />
            <MapUpdater position={mapCenter} />
            <MapClickHandler
              onLocationSet={(lat, lng) => {
                setLocationOverrideConfig({
                  enabled: true,
                  mode: "static",
                  staticPosition: {
                    latitude: lat,
                    longitude: lng,
                    accuracy: 10,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                  },
                })
              }}
            />
          </MapContainer>
        </div>

        {/* Info Panel */}
        <div className="bg-white border-t border-gray-200 p-4">
          {effectiveLocation ? (
            <>
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
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600">Click on the map to set a location</p>
              <p className="text-xs text-gray-400 mt-1">Or select a preset from the Location menu</p>
            </div>
          )}

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
    </div>
  )
}
