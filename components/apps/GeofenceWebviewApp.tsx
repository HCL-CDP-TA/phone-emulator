"use client"

import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"
import { useState, useEffect, useRef } from "react"
import { useAppRegistry } from "@/lib/appRegistry"
import { GeofenceMonitor, Geofence } from "@hcl-cdp-ta/geofence-sdk"
import { useGeofenceApps } from "@/contexts/GeofenceAppsContext"

interface GeofenceWebviewAppProps extends AppProps {
  appId: string
  icon: React.ReactNode
}

export default function GeofenceWebviewApp({ appId, onSendNotification }: GeofenceWebviewAppProps) {
  // Get config from context (so it updates when settings change)
  const { getApp } = useGeofenceApps()
  const config = getApp(appId)

  // Get location from context
  const { effectiveLocation, openApp, setGeofenceMonitoring } = usePhone()
  const appRegistry = useAppRegistry()

  // User ID management
  const [userId, setUserId] = useState<string | null>(null)
  const [userIdInput, setUserIdInput] = useState("")
  const [showUserIdModal, setShowUserIdModal] = useState(false)

  // SDK management
  const [monitor, setMonitor] = useState<GeofenceMonitor | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)

  // Iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // localStorage keys (namespaced per app)
  const userIdStorageKey = config ? `geofence-app-${config.id}-user-id` : ""
  const monitoringEnabledKey = config ? `geofence-app-${config.id}-monitoring-enabled` : ""

  // Load userId from localStorage on mount
  useEffect(() => {
    if (!config) return
    const saved = localStorage.getItem(userIdStorageKey)
    if (saved) {
      setUserId(saved)
      setUserIdInput(saved)
    }
  }, [userIdStorageKey, config])

  // Initialize monitor when userId changes
  useEffect(() => {
    if (!config || !userId) return

    const apiUrl = process.env.NEXT_PUBLIC_GEOFENCE_API_URL
    console.log(`[${config.name}] 🔍 NEXT_PUBLIC_GEOFENCE_API_URL value:`, apiUrl)

    if (!apiUrl) {
      console.error(`[${config.name}] ❌ NEXT_PUBLIC_GEOFENCE_API_URL is not configured`)
      return
    }

    console.log(`[${config.name}] ✅ Initializing GeofenceMonitor with apiUrl:`, apiUrl)
    const newMonitor = new GeofenceMonitor({
      apiUrl: apiUrl,
      userId: userId,
      appId: config.id,
      enableServerEvaluation: true,
      significantMovementThreshold: 50,
      pollingInterval: 1000,
      enableHighAccuracy: true,
      debug: process.env.NODE_ENV === "development",
      testMode: true, // Enable test mode to use setTestPosition
    })

    setMonitor(newMonitor)
    setHasAutoStarted(false) // Reset auto-start flag for new monitor

    return () => {
      newMonitor.stop()
      setIsMonitoring(false)
      setGeofenceMonitoring(false)
    }
  }, [userId, config, setGeofenceMonitoring])

  // Update SDK position when effectiveLocation changes
  useEffect(() => {
    if (!config || !monitor || !effectiveLocation) return

    monitor.setTestPosition(effectiveLocation.coords.latitude, effectiveLocation.coords.longitude)
  }, [monitor, effectiveLocation, config])

  // Set up SDK event listeners
  useEffect(() => {
    if (!config || !monitor) return

    const handlePosition = () => {
      // Position updates handled by SDK
    }

    const handleEnter = (geofence: Geofence) => {
      // Check if enter notifications enabled
      if (!config.notifications.enter.enabled) return

      // Send notification
      const app = appRegistry.find(a => a.id === config.id)
      onSendNotification?.({
        appId: config.id,
        appName: config.name,
        title: "Geofence Entry",
        message: `Entered ${geofence.name}`,
        icon: app?.icon,
        iconColor: app?.iconColor,
        onClick: () => openApp(config.id),
      })
    }

    const handleExit = (geofence: Geofence) => {
      // Check if exit notifications enabled
      if (!config.notifications.exit.enabled) return

      // Send notification
      const app = appRegistry.find(a => a.id === config.id)
      onSendNotification?.({
        appId: config.id,
        appName: config.name,
        title: "Geofence Exit",
        message: `Exited ${geofence.name}`,
        icon: app?.icon,
        iconColor: app?.iconColor,
        onClick: () => openApp(config.id),
      })
    }

    const handleError = (error: Error) => {
      console.error(`[${config.name}] GeofenceMonitor error:`, error)
    }

    monitor.on("position", handlePosition)
    monitor.on("enter", handleEnter)
    monitor.on("exit", handleExit)
    monitor.on("error", handleError)

    return () => {
      monitor.off("position", handlePosition)
      monitor.off("enter", handleEnter)
      monitor.off("exit", handleExit)
      monitor.off("error", handleError)
    }
  }, [monitor, config, onSendNotification, openApp, appRegistry])

  // Listen for postMessage from iframe (for userIdMode: 'postmessage')
  useEffect(() => {
    if (!config || config.userIdMode !== "postmessage") return

    function handleMessage(event: MessageEvent) {
      // Validate message structure
      if (event.data && event.data.type === "set-user-id") {
        const receivedUserId = event.data.userId

        // Handle null or empty string as logout (clear userId)
        if (receivedUserId === null || receivedUserId === "") {
          localStorage.removeItem(userIdStorageKey)
          setUserId(null)
          return
        }

        // Set userId if valid string
        if (typeof receivedUserId === "string" && receivedUserId.trim()) {
          const trimmedUserId = receivedUserId.trim()
          localStorage.setItem(userIdStorageKey, trimmedUserId)
          setUserId(trimmedUserId)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [config, userIdStorageKey])

  // Auto-start monitoring when monitor is created (only once, if enabled)
  useEffect(() => {
    if (!config || !monitor || hasAutoStarted || !userId) return

    const autoStart = async () => {
      // Check saved preference (defaults to true for first-time users)
      const savedMonitoring = localStorage.getItem(monitoringEnabledKey)
      const shouldMonitor = savedMonitoring === null || savedMonitoring === "true"

      // Check if geotracking is enabled in config
      if (!shouldMonitor || !config.geotrackingEnabled) {
        setHasAutoStarted(true) // Mark as handled, but don't start
        return
      }

      try {
        setIsMonitoring(true)
        setHasAutoStarted(true)
        setGeofenceMonitoring(true)
        await monitor.start()
        localStorage.setItem(monitoringEnabledKey, "true")
      } catch (error) {
        console.error(`[${config.name}] Failed to start monitoring:`, error)
        setIsMonitoring(false)
        setGeofenceMonitoring(false)
        localStorage.setItem(monitoringEnabledKey, "false")
      }
    }

    autoStart()
  }, [monitor, hasAutoStarted, userId, monitoringEnabledKey, config, setGeofenceMonitoring])

  // Handle geotracking enabled/disabled changes
  useEffect(() => {
    if (!config || !monitor) return

    if (config.geotrackingEnabled && userId) {
      // Geotracking enabled - start if not already monitoring
      if (!isMonitoring) {
        monitor
          .start()
          .then(() => {
            setIsMonitoring(true)
            setGeofenceMonitoring(true)
            localStorage.setItem(monitoringEnabledKey, "true")
          })
          .catch(error => {
            console.error(`[${config.name}] Failed to start monitoring:`, error)
            setIsMonitoring(false)
            setGeofenceMonitoring(false)
          })
      }
    } else {
      // Geotracking disabled - stop if monitoring
      if (isMonitoring) {
        monitor.stop()
        setIsMonitoring(false)
        setGeofenceMonitoring(false)
        localStorage.setItem(monitoringEnabledKey, "false")
      }
    }
  }, [config, monitor, userId, isMonitoring, monitoringEnabledKey, setGeofenceMonitoring])

  // Handle manual userId save
  const handleSaveUserId = () => {
    if (!config || !userIdInput.trim()) return

    const trimmedUserId = userIdInput.trim()
    localStorage.setItem(userIdStorageKey, trimmedUserId)
    setUserId(trimmedUserId)
    setShowUserIdModal(false)
  }

  // Handle case where config is not found
  if (!config) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-600">App configuration not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* User ID button (only for manual mode) */}
      {config.userIdMode === "manual" && (
        <button
          onClick={() => setShowUserIdModal(true)}
          className={`absolute top-3 right-3 z-20 p-2 rounded-full shadow-lg border transition-all ${
            userId ? "bg-blue-500/90 border-blue-600 hover:bg-blue-600" : "bg-white/90 border-gray-300 hover:bg-white"
          }`}
          title={userId ? `User ID: ${userId} (click to change)` : "Set User ID for geofence monitoring"}>
          <svg className={`w-4 h-4 ${userId ? "text-white" : "text-gray-600"}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </button>
      )}

      {/* Iframe content */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          src={config.url}
          title={config.name}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Manual entry modal */}
      {showUserIdModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-[90%]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{userId ? "Change User ID" : "Set User ID"}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter your customer ID to receive location-based notifications.
            </p>
            <input
              type="text"
              value={userIdInput}
              onChange={e => setUserIdInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveUserId()}
              placeholder="e.g., customer@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveUserId}
                disabled={!userIdInput.trim()}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                Save
              </button>
              <button
                onClick={() => setShowUserIdModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
