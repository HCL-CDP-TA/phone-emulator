"use client"

import { Polygon, Popup } from "react-leaflet"
import { Geofence } from "@/hooks/useGeofences"
import { LatLngExpression } from "leaflet"

interface GeofenceLayerProps {
  geofences: Geofence[]
}

export default function GeofenceLayer({ geofences }: GeofenceLayerProps) {
  return (
    <>
      {geofences.map(geofence => {
        // Convert coordinates to Leaflet format [lat, lng]
        const positions: LatLngExpression[] = geofence.coordinates.map(coord => [
          coord.lat,
          coord.lng,
        ])

        // Skip if polygon has less than 3 points
        if (positions.length < 3) {
          console.warn(`Geofence ${geofence.name} has less than 3 coordinates, skipping`)
          return null
        }

        return (
          <Polygon
            key={geofence.id}
            positions={positions}
            pathOptions={{
              color: "#3b82f6", // Blue stroke
              fillColor: "#3b82f6", // Blue fill
              fillOpacity: 0.1, // Very transparent
              weight: 2, // 2px stroke
              dashArray: "5, 5", // Dashed line
            }}
            eventHandlers={{
              // Prevent geofence from blocking map clicks
              click: (e) => {
                // Don't stop propagation - let click pass through to map
              }
            }}
            interactive={false}>
            <Popup>
              <div className="text-sm">
                <strong className="block mb-1">{geofence.name}</strong>
                <div className="text-gray-600">{geofence.coordinates.length} vertices</div>
                {geofence.enabled !== undefined && (
                  <div className="text-gray-600">
                    Status: {geofence.enabled ? "Enabled" : "Disabled"}
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        )
      })}
    </>
  )
}
