"use client"

import { Circle, Popup } from "react-leaflet"
import { Geofence } from "@/hooks/useGeofences"

interface GeofenceLayerProps {
  geofences: Geofence[]
}

export default function GeofenceLayer({ geofences }: GeofenceLayerProps) {
  return (
    <>
      {geofences.map(geofence => (
        <Circle
          key={geofence.id}
          center={[geofence.latitude, geofence.longitude]}
          radius={geofence.radius}
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
              <div className="text-gray-600">Radius: {geofence.radius}m</div>
              {geofence.enabled !== undefined && (
                <div className="text-gray-600">
                  Status: {geofence.enabled ? "Enabled" : "Disabled"}
                </div>
              )}
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  )
}
