"use client"

import { AppProps, GeofenceZone } from "@/types/app"
import { useLocation } from "@/hooks/useLocation"
import { usePhone } from "@/contexts/PhoneContext"
import { isInsideGeofence } from "@/lib/locationUtils"
import { DEFAULT_GEOFENCE_PRESETS } from "@/lib/geofencePresets"
import { useEffect, useState, useMemo, useRef } from "react"

interface GeofenceEvent {
  time: Date
  event: "enter" | "exit"
  geofence: string
}

export default function GeofenceApp({ onClose }: AppProps) {
  const { position, error, isLoading } = useLocation()
  const { locationOverride } = usePhone()
  const [selectedGeofence, setSelectedGeofence] = useState<GeofenceZone | null>(null)
  const [eventHistory, setEventHistory] = useState<GeofenceEvent[]>([])
  const previousInsideRef = useRef<boolean | null>(null)

  // Get effective location (override if enabled, otherwise real GPS)
  const currentPosition = useMemo(() => {
    if (!locationOverride.enabled) {
      return position
    }

    if (locationOverride.mode === "static" && locationOverride.staticPosition) {
      const pos = locationOverride.staticPosition
      return {
        coords: {
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy ?? 10,
          altitude: pos.altitude ?? null,
          altitudeAccuracy: pos.altitudeAccuracy ?? null,
          heading: pos.heading ?? null,
          speed: pos.speed ?? null,
        },
        timestamp: 0, // Will be updated by effect if needed
      } as GeolocationPosition
    }

    if (locationOverride.mode === "route" && locationOverride.route) {
      const route = locationOverride.route
      const currentWaypoint = route.waypoints[route.currentWaypointIndex]
      if (!currentWaypoint) return position

      return {
        coords: {
          latitude: currentWaypoint.latitude,
          longitude: currentWaypoint.longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: currentWaypoint.speed ?? null,
        },
        timestamp: 0, // Will be updated by effect if needed
      } as GeolocationPosition
    }

    return position
  }, [locationOverride, position])

  // Calculate if currently inside geofence (derived state)
  const isInside = useMemo(() => {
    if (!selectedGeofence || !currentPosition) {
      return false
    }

    return isInsideGeofence(
      {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      },
      {
        latitude: selectedGeofence.latitude,
        longitude: selectedGeofence.longitude,
      },
      selectedGeofence.radiusMeters
    )
  }, [selectedGeofence, currentPosition])

  // Track enter/exit events when inside state changes
  useEffect(() => {
    if (!selectedGeofence) {
      previousInsideRef.current = null
      return
    }

    // Check if this is a state change (not the initial mount)
    if (previousInsideRef.current !== null && previousInsideRef.current !== isInside) {
      const newEvent: GeofenceEvent = {
        time: new Date(),
        event: isInside ? "enter" : "exit",
        geofence: selectedGeofence.name,
      }

      // Use queueMicrotask to avoid cascading renders warning
      queueMicrotask(() => {
        setEventHistory((prev) => {
          const updated: GeofenceEvent[] = [newEvent, ...prev]
          // Keep only the most recent 20 events
          return updated.slice(0, 20)
        })
      })
    }

    // Update ref
    previousInsideRef.current = isInside
  }, [selectedGeofence, isInside])

  // Handle geofence selection change
  const handleGeofenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const geofenceId = e.target.value
    if (!geofenceId) {
      setSelectedGeofence(null)
      previousInsideRef.current = null
      return
    }

    const geofence = DEFAULT_GEOFENCE_PRESETS.find((g: GeofenceZone) => g.id === geofenceId)
    if (geofence) {
      setSelectedGeofence(geofence)
      previousInsideRef.current = null // Reset to track first state
    }
  }

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <button onClick={onClose} className="text-blue-500 hover:text-blue-600 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Geofence Monitor</h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Geofence Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <label htmlFor="geofence-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Geofence Zone
          </label>
          <select
            id="geofence-select"
            value={selectedGeofence?.id || ""}
            onChange={handleGeofenceChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Choose a zone --</option>
            {DEFAULT_GEOFENCE_PRESETS.map((geofence: GeofenceZone) => (
              <option key={geofence.id} value={geofence.id}>
                {geofence.name}
              </option>
            ))}
          </select>
          {selectedGeofence && (
            <p className="text-xs text-gray-500 mt-2">{selectedGeofence.description}</p>
          )}
        </div>

        {/* Current Status */}
        {selectedGeofence && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Current Status</h2>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                <p className="text-sm text-gray-600 mt-2">Getting location...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600">Location error: {error.message}</p>
              </div>
            ) : !currentPosition ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Location not available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-center py-3 px-4 rounded-lg ${
                    isInside ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    {isInside ? (
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    ) : (
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    )}
                  </svg>
                  <span className="font-semibold">
                    {isInside ? "Inside Geofence" : "Outside Geofence"}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Latitude:</span>
                    <span className="font-mono">{currentPosition.coords.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Longitude:</span>
                    <span className="font-mono">{currentPosition.coords.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event History */}
        {eventHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Event History</h2>
              <button
                onClick={() => setEventHistory([])}
                className="text-xs text-blue-500 hover:text-blue-600">
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {eventHistory.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    event.event === "enter" ? "bg-green-50" : "bg-red-50"
                  }`}>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-3 ${
                        event.event === "enter" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.event === "enter" ? "Entered" : "Exited"} {event.geofence}
                      </p>
                      <p className="text-xs text-gray-500">{formatTime(event.time)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedGeofence && (
          <div className="text-center py-12">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <p className="text-gray-600 text-sm">Select a geofence zone to start monitoring</p>
          </div>
        )}
      </div>
    </div>
  )
}
