"use client"

import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"
import { isInsideGeofence } from "@/lib/locationUtils"
import { useGeofences } from "@/hooks/useGeofences"
import { useMemo, useState, useEffect, useRef } from "react"
import { getAppById } from "@/lib/appRegistry"
import { HclCdp } from "@hcl-cdp-ta/hclcdp-web-sdk"

interface GeofenceStatus {
  id: string
  name: string
  isInside: boolean
}

interface GeofenceEvent {
  id: string
  time: Date
  event: "enter" | "exit"
  geofence: string
  geofenceId: string
}

export default function GeofenceApp({ onClose, onSendNotification }: AppProps) {
  // Get location and phone number from context (provided by the phone OS)
  const { effectiveLocation, openApp, phoneNumber } = usePhone()

  // App fetches its own geofences from API
  const { geofences, isLoading, error, refetch } = useGeofences()

  // App manages its own event history
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([])
  const previousStatusRef = useRef<Map<string, boolean>>(new Map())

  const clearGeofenceEvents = () => {
    setGeofenceEvents([])
  }

  const [isCdpReady, setIsCdpReady] = useState(false)

  // Initialize CDP SDK on mount
  useEffect(() => {
    const initializeCDP = async () => {
      const config = {
        writeKey: "zwmwfmv904ethb4yi3v8",
        cdpEndpoint: "https://pl.dev.hxcd.now.hclsoftware.cloud",
        inactivityTimeout: 30, // Session timeout in minutes
        enableDeviceSessionLogging: false, // Track device session start/end events
        enableUserSessionLogging: false, // Track user session start/end events
        enableUserLogoutLogging: false, // Track user logout events
        destinations: [],
      }

      try {
        // Initialize the SDK
        await HclCdp.init(config, (error, sessionData) => {
          if (error) {
            console.error("CDP initialization failed:", error)
          } else {
            console.log("CDP initialized:", sessionData)
            // { deviceSessionId: "...", userSessionId: "...", deviceId: "..." }
            setIsCdpReady(true)
          }
        })
      } catch (error) {
        console.error("CDP initialization error:", error)
      }
    }

    initializeCDP()
  }, [])

  // Identify user when phone number becomes available
  useEffect(() => {
    if (isCdpReady && phoneNumber) {
      HclCdp.identify(phoneNumber).catch(err => {
        console.error("Failed to identify user:", err)
      })
    }
  }, [isCdpReady, phoneNumber])

  // Calculate status for all geofences
  const geofenceStatuses = useMemo<GeofenceStatus[]>(() => {
    if (!effectiveLocation) return []

    return geofences.map(geofence => {
      const isInside = isInsideGeofence(
        {
          latitude: effectiveLocation.coords.latitude,
          longitude: effectiveLocation.coords.longitude,
        },
        {
          latitude: geofence.latitude,
          longitude: geofence.longitude,
        },
        geofence.radius,
      )

      return {
        id: geofence.id,
        name: geofence.name,
        isInside,
      }
    })
  }, [geofences, effectiveLocation])

  // 🎯 GEOFENCE MONITORING LOGIC - This is where the app handles location updates
  useEffect(() => {
    if (!effectiveLocation || geofences.length === 0) return

    geofences.forEach(geofence => {
      const isInside = isInsideGeofence(
        {
          latitude: effectiveLocation.coords.latitude,
          longitude: effectiveLocation.coords.longitude,
        },
        {
          latitude: geofence.latitude,
          longitude: geofence.longitude,
        },
        geofence.radius,
      )

      const previousStatus = previousStatusRef.current.get(geofence.id)

      // Only trigger events on state changes (not initial mount)
      if (previousStatus !== undefined && previousStatus !== isInside) {
        const eventType = isInside ? "enter" : "exit"

        // Add to app's event history
        const newEvent: GeofenceEvent = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          time: new Date(),
          event: eventType,
          geofence: geofence.name,
          geofenceId: geofence.id,
        }
        setGeofenceEvents(prev => [newEvent, ...prev].slice(0, 50))

        // Send notification
        const geofenceApp = getAppById("geofence")
        if (onSendNotification) {
          onSendNotification({
            appId: "geofence",
            appName: "Geofence Monitor",
            title: `Geofence ${eventType === "enter" ? "Entry" : "Exit"}`,
            message: `${eventType === "enter" ? "Entered" : "Exited"} ${geofence.name}`,
            icon: geofenceApp?.icon,
            iconColor: geofenceApp?.iconColor,
            onClick: () => {
              openApp("geofence")
            },
          })
        }

        // 🔥 FIRE CDP EVENTS
        if (isCdpReady) {
          try {
            const eventData = {
              type: eventType === "enter" ? "geofence_entry" : "geofence_exit",
              properties: {
                geofenceId: geofence.id,
                geofenceName: geofence.name,
                latitude: effectiveLocation.coords.latitude,
                longitude: effectiveLocation.coords.longitude,
                accuracy: effectiveLocation.coords.accuracy,
                phoneNumber: phoneNumber || "unknown",
                timestamp: new Date().toISOString(),
              },
            }

            // Track the event with HCL CDP
            HclCdp.track(eventData.type, eventData.properties)

            console.log("🎯 Geofence event tracked via CDP:", eventData)
          } catch (error) {
            console.error("Failed to track geofence event:", error)
          }
        } else {
          // CDP not initialized yet - log for debugging
          console.log("🎯 Geofence event (CDP not ready):", {
            eventType: eventType === "enter" ? "geofence_entry" : "geofence_exit",
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            latitude: effectiveLocation.coords.latitude,
            longitude: effectiveLocation.coords.longitude,
            accuracy: effectiveLocation.coords.accuracy,
            phoneNumber: phoneNumber || "unknown",
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Update previous status
      previousStatusRef.current.set(geofence.id, isInside)
    })
  }, [effectiveLocation, geofences, onSendNotification, openApp, isCdpReady, phoneNumber])

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
        <button onClick={refetch} className="text-blue-500 hover:text-blue-600 p-1" disabled={isLoading}>
          <svg
            className={`w-6 h-6 ${isLoading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading State */}
        {isLoading && geofences.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-sm text-gray-600 mt-4">Loading geofences...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Failed to load geofences</h3>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
                <button onClick={refetch} className="text-sm text-red-600 hover:text-red-500 underline mt-2">
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Location */}
        {effectiveLocation && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Current Location</h2>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Latitude:</span>
                <span className="font-mono">{effectiveLocation.coords.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Longitude:</span>
                <span className="font-mono">{effectiveLocation.coords.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Accuracy:</span>
                <span className="font-mono">{effectiveLocation.coords.accuracy.toFixed(1)}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Geofence Status List */}
        {!isLoading && geofences.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Geofences ({geofences.length})</h2>
            <div className="space-y-2">
              {geofenceStatuses.map(status => {
                const geofence = geofences.find(g => g.id === status.id)
                return (
                  <div
                    key={status.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      status.isInside ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${status.isInside ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <p className="text-sm font-medium text-gray-900">{status.name}</p>
                      </div>
                      {geofence && (
                        <p className="text-xs text-gray-500 mt-1 ml-4">
                          {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)} • {geofence.radius}m radius
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        status.isInside ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                      {status.isInside ? "Inside" : "Outside"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Event History */}
        {geofenceEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Event History ({geofenceEvents.length})</h2>
              <button onClick={clearGeofenceEvents} className="text-xs text-blue-500 hover:text-blue-600">
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {geofenceEvents.map(event => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    event.event === "enter" ? "bg-green-50" : "bg-red-50"
                  }`}>
                  <div className="flex items-center flex-1">
                    <div
                      className={`w-2 h-2 rounded-full mr-3 ${event.event === "enter" ? "bg-green-500" : "bg-red-500"}`}
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
        {!isLoading && !error && geofences.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <p className="text-gray-600 text-sm mb-2">No geofences configured</p>
            <p className="text-gray-500 text-xs">Configure geofences in your API to start monitoring</p>
          </div>
        )}

        {/* No Location State */}
        {!effectiveLocation && !isLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Location unavailable</h3>
                <p className="text-sm text-yellow-700 mt-1">Enable location services to monitor geofences</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
