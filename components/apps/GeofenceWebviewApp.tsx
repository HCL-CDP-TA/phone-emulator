"use client"

import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"
import { useState, useEffect, useRef } from "react"
import { useAppRegistry } from "@/lib/appRegistry"
import { GeofenceMonitor, Geofence } from "@hcl-cdp-ta/geofence-sdk"
import { GeofenceAppConfig } from "@/components/apps/geofenceAppsConfig"

interface GeofenceWebviewAppProps extends AppProps {
  config: GeofenceAppConfig
  icon: React.ReactNode
}

export default function GeofenceWebviewApp({ config, onSendNotification }: GeofenceWebviewAppProps) {
  // Get location from context
  const { effectiveLocation, openApp } = usePhone()
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
  const userIdStorageKey = `geofence-app-${config.id}-user-id`
  const monitoringEnabledKey = `geofence-app-${config.id}-monitoring-enabled`

  // Load userId from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(userIdStorageKey)
    if (saved) {
      setUserId(saved)
      setUserIdInput(saved)
    }
  }, [userIdStorageKey])

  // Initialize monitor when userId changes
  useEffect(() => {
    if (!userId) return

    const newMonitor = new GeofenceMonitor({
      apiUrl: process.env.NEXT_PUBLIC_GEOFENCE_API_URL || "http://localhost:3001",
      userId: userId,
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

    const handleEnter = (geofence: Geofence) => {
      console.log(`🎯 [${config.name}] Geofence ENTER event:`, geofence)

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
      console.log(`🎯 [${config.name}] Geofence EXIT event:`, geofence)

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

    monitor.on("enter", handleEnter)
    monitor.on("exit", handleExit)
    monitor.on("error", handleError)

    return () => {
      monitor.off("enter", handleEnter)
      monitor.off("exit", handleExit)
      monitor.off("error", handleError)
    }
  }, [monitor, config, onSendNotification, openApp, appRegistry])

  // Listen for postMessage from iframe (for userIdMode: 'postmessage')
  useEffect(() => {
    if (config.userIdMode !== "postmessage") return

    function handleMessage(event: MessageEvent) {
      // Validate message structure
      if (event.data && event.data.type === "set-user-id") {
        const receivedUserId = event.data.userId
        if (typeof receivedUserId === "string" && receivedUserId.trim()) {
          const trimmedUserId = receivedUserId.trim()
          localStorage.setItem(userIdStorageKey, trimmedUserId)
          setUserId(trimmedUserId)
          console.log(`[${config.name}] Received userId via postMessage:`, trimmedUserId)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [config, userIdStorageKey])

  // Auto-start monitoring when monitor is created (only once, if enabled)
  useEffect(() => {
    if (!monitor || hasAutoStarted || !userId) return

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
        await monitor.start()
        localStorage.setItem(monitoringEnabledKey, "true")
        console.log(`[${config.name}] Monitoring started automatically`)
      } catch (error) {
        console.error(`[${config.name}] Failed to start monitoring:`, error)
        setIsMonitoring(false)
        localStorage.setItem(monitoringEnabledKey, "false")
      }
    }

    autoStart()
  }, [monitor, hasAutoStarted, userId, monitoringEnabledKey, config.name, config.geotrackingEnabled])

  // Handle geotracking enabled/disabled changes
  useEffect(() => {
    if (!monitor) return

    if (config.geotrackingEnabled && userId) {
      // Geotracking enabled - start if not already monitoring
      if (!isMonitoring) {
        monitor
          .start()
          .then(() => {
            setIsMonitoring(true)
            localStorage.setItem(monitoringEnabledKey, "true")
            console.log(`[${config.name}] Monitoring enabled via settings`)
          })
          .catch(error => {
            console.error(`[${config.name}] Failed to start monitoring:`, error)
            setIsMonitoring(false)
          })
      }
    } else {
      // Geotracking disabled - stop if monitoring
      if (isMonitoring) {
        monitor.stop()
        setIsMonitoring(false)
        localStorage.setItem(monitoringEnabledKey, "false")
        console.log(`[${config.name}] Monitoring disabled via settings`)
      }
    }
  }, [config.geotrackingEnabled, monitor, userId, isMonitoring, monitoringEnabledKey, config.name])

  // Handle manual userId save
  const handleSaveUserId = () => {
    if (!userIdInput.trim()) return

    const trimmedUserId = userIdInput.trim()
    localStorage.setItem(userIdStorageKey, trimmedUserId)
    setUserId(trimmedUserId)
    setShowUserIdModal(false)
    console.log(`[${config.name}] User ID set manually:`, trimmedUserId)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          src={config.url}
          title={config.name}
          className="absolute inset-0 border-0"
          style={{ width: "calc(100% + 20px)", height: "calc(100% + 20px)" }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
      {/* Manual entry button (only for userIdMode: 'manual') */}
      {config.userIdMode === "manual" && (
        <button
          onClick={() => setShowUserIdModal(true)}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg hover:bg-white border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
          title="Set User ID for geofence monitoring">
          <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          {userId ? "Change User" : "Set User ID"}
        </button>
      )}

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
