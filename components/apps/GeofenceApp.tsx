"use client"

import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"
import { useState, useEffect } from "react"
import { getAppById } from "@/lib/appRegistry"
import { GeofenceMonitor, Geofence } from "@hcl-cdp-ta/geofence-sdk"

interface GeofenceEvent {
  id: string
  time: Date
  event: "enter" | "exit"
  geofence: string
  geofenceId: string
}

export default function GeofenceApp({ onClose, onSendNotification }: AppProps) {
  // Get location from context (for display only - SDK uses its own GPS)
  const { effectiveLocation, openApp } = usePhone()

  // User ID management
  const [userId, setUserId] = useState<string | null>(null)
  const [userIdInput, setUserIdInput] = useState("")
  const [showUserIdPrompt, setShowUserIdPrompt] = useState(true)

  // SDK management
  const [monitor, setMonitor] = useState<GeofenceMonitor | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [sdkError, setSdkError] = useState<Error | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)

  // Event history (in-memory only, not persisted)
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([])

  // Load userId from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("geofence-user-id")
    if (saved) {
      setUserId(saved)
      setUserIdInput(saved)
      setShowUserIdPrompt(false)
    }
  }, [])

  // Initialize monitor when userId changes
  useEffect(() => {
    if (!userId) return

    const newMonitor = new GeofenceMonitor({
      apiUrl: process.env.NEXT_PUBLIC_GEOFENCE_API_URL || "http://localhost:3001",
      userId: userId,
      appId: "geofence",
      enableServerEvaluation: true,
      significantMovementThreshold: 50,
      pollingInterval: 10000,
      enableHighAccuracy: true,
      debug: process.env.NODE_ENV === "development",
      testMode: true, // Enable test mode to use setTestPosition
    })

    setMonitor(newMonitor)
    setHasAutoStarted(false) // Reset auto-start flag for new monitor

    return () => {
      newMonitor.stop()
      setIsMonitoring(false)
    }
  }, [userId])

  // Update SDK position when effectiveLocation changes
  useEffect(() => {
    if (!monitor || !effectiveLocation) return

    monitor.setTestPosition(effectiveLocation.coords.latitude, effectiveLocation.coords.longitude)
  }, [monitor, effectiveLocation])

  // Set up SDK event listeners
  useEffect(() => {
    if (!monitor) return

    const handlePosition = (position: GeolocationPosition) => {
      console.log("📍 SDK position update:", {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
    }

    const handleEnter = (geofence: Geofence) => {
      console.log("🎯 Geofence ENTER event from server:", geofence)
      // Add to event history
      const event: GeofenceEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        time: new Date(),
        event: "enter",
        geofence: geofence.name,
        geofenceId: geofence.id,
      }
      setGeofenceEvents(prev => [event, ...prev].slice(0, 50))

      // Send notification
      const geofenceApp = getAppById("geofence")
      onSendNotification?.({
        appId: "geofence",
        appName: "Geofence Monitor",
        title: "Geofence Entry",
        message: `Entered ${geofence.name}`,
        icon: geofenceApp?.icon,
        iconColor: geofenceApp?.iconColor,
        onClick: () => openApp("geofence"),
      })
    }

    const handleExit = (geofence: Geofence) => {
      console.log("🎯 Geofence EXIT event from server:", geofence)
      // Add to event history
      const event: GeofenceEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        time: new Date(),
        event: "exit",
        geofence: geofence.name,
        geofenceId: geofence.id,
      }
      setGeofenceEvents(prev => [event, ...prev].slice(0, 50))

      // Send notification
      const geofenceApp = getAppById("geofence")
      onSendNotification?.({
        appId: "geofence",
        appName: "Geofence Monitor",
        title: "Geofence Exit",
        message: `Exited ${geofence.name}`,
        icon: geofenceApp?.icon,
        iconColor: geofenceApp?.iconColor,
        onClick: () => openApp("geofence"),
      })
    }

    const handleError = (error: Error) => {
      console.error("GeofenceMonitor error:", error)
      setSdkError(error)
    }

    monitor.on("enter", handleEnter)
    monitor.on("exit", handleExit)
    monitor.on("position", handlePosition)
    monitor.on("error", handleError)

    return () => {
      monitor.off("enter", handleEnter)
      monitor.off("exit", handleExit)
      monitor.off("position", handlePosition)
      monitor.off("error", handleError)
    }
  }, [monitor, onSendNotification, openApp])

  // Auto-start monitoring when monitor is created (only once, if enabled)
  useEffect(() => {
    if (!monitor || hasAutoStarted) return

    const autoStart = async () => {
      // Check saved preference (defaults to true for first-time users)
      const savedMonitoring = localStorage.getItem("geofence-monitoring-enabled")
      const shouldMonitor = savedMonitoring === null || savedMonitoring === "true"

      if (!shouldMonitor) {
        setHasAutoStarted(true) // Mark as handled, but don't start
        return
      }

      try {
        setIsMonitoring(true)
        setHasAutoStarted(true)
        setSdkError(null)
        await monitor.start()
        localStorage.setItem("geofence-monitoring-enabled", "true")
      } catch (error) {
        console.error("Failed to start monitoring:", error)
        setSdkError(error as Error)
        setIsMonitoring(false)
      }
    }

    autoStart()
  }, [monitor, hasAutoStarted])

  const handleUserIdSubmit = () => {
    if (!userIdInput.trim()) return

    const trimmedUserId = userIdInput.trim()
    localStorage.setItem("geofence-user-id", trimmedUserId)
    setUserId(trimmedUserId)
    setShowUserIdPrompt(false)
  }

  const handleChangeUser = () => {
    setShowUserIdPrompt(true)
    if (monitor) {
      monitor.stop()
    }
    setIsMonitoring(false)
    setGeofenceEvents([])
    // Don't change the monitoring preference in localStorage - keep it for the next user
  }

  const handleStopMonitoring = () => {
    if (monitor) {
      monitor.stop()
      setIsMonitoring(false)
      localStorage.setItem("geofence-monitoring-enabled", "false")
    }
  }

  const handleStartMonitoring = async () => {
    if (!monitor) return
    try {
      setIsMonitoring(true)
      setSdkError(null)
      await monitor.start()
      localStorage.setItem("geofence-monitoring-enabled", "true")
    } catch (error) {
      console.error("Failed to start monitoring:", error)
      setSdkError(error as Error)
      setIsMonitoring(false)
      localStorage.setItem("geofence-monitoring-enabled", "false")
    }
  }

  const clearGeofenceEvents = () => {
    setGeofenceEvents([])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // User ID Input Prompt
  if (showUserIdPrompt) {
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
          <div className="w-6 h-6" />
        </div>

        {/* User ID Setup */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup User Identifier</h2>
              <p className="text-sm text-gray-600">
                Enter a user ID to begin geofence monitoring. This simulates a customer app that tracks user location
                (e.g., bank or retail app).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  User Identifier
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userIdInput}
                  onChange={e => setUserIdInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUserIdSubmit()}
                  placeholder="e.g., user-123, customer@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleUserIdSubmit}
                disabled={!userIdInput.trim()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                Start Monitoring
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This app uses server-side geofence evaluation. Your location is sent to the
                  server for processing, and geofence events are generated server-side.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Monitoring Dashboard
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
        <button onClick={handleChangeUser} className="text-blue-500 hover:text-blue-600 text-sm p-1">
          Change User
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Error Banner */}
        {sdkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Monitoring Error</h3>
                <p className="text-sm text-red-700 mt-1">{sdkError.message}</p>
                <button
                  onClick={handleStartMonitoring}
                  className="text-sm text-red-600 hover:text-red-500 underline mt-2">
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Status */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Monitoring Status</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">User ID:</span>
              <span className="text-xs font-mono text-gray-900">{userId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Status:</span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isMonitoring ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-xs font-medium text-gray-900">{isMonitoring ? "Active" : "Stopped"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Polling Interval:</span>
              <span className="text-xs text-gray-900">10 seconds</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Movement Threshold:</span>
              <span className="text-xs text-gray-900">50 meters</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Evaluation:</span>
              <span className="text-xs font-medium text-blue-600">Server-Side</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            {isMonitoring ? (
              <button
                onClick={handleStopMonitoring}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors">
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={handleStartMonitoring}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors">
                Start Monitoring
              </button>
            )}
          </div>
        </div>

        {/* Current Location */}
        {effectiveLocation && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Current Location (Display Only)</h2>
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
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                Note: SDK uses real GPS independently. This shows your current location (may include overrides from
                Location Config).
              </p>
            </div>
          </div>
        )}

        {/* No Location Warning */}
        {!effectiveLocation && (
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
                <p className="text-sm text-yellow-700 mt-1">
                  The SDK is using browser GPS independently. Location display will appear when GPS is available.
                </p>
              </div>
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
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {event.event === "enter" ? "Entered" : "Exited"} {event.geofence}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <p className="text-xs text-gray-500">{formatTime(event.time)}</p>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          Server
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {geofenceEvents.length === 0 && isMonitoring && (
          <div className="text-center py-12">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <p className="text-gray-600 text-sm mb-2">No geofence events yet</p>
            <p className="text-gray-500 text-xs">Events will appear here when you enter or exit a geofence zone</p>
          </div>
        )}
      </div>
    </div>
  )
}
