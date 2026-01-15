"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Phone from "@/components/phone/Phone"
import PhoneNumberLogin from "@/components/phone/PhoneNumberLogin"
import { PhoneProvider, usePhone } from "@/contexts/PhoneContext"
import { GeofenceAppsProvider } from "@/contexts/GeofenceAppsContext"
import { useSMSReceiver } from "@/hooks/useSMSReceiver"
import { useEmailReceiver } from "@/hooks/useEmailReceiver"
import { useWhatsAppReceiver } from "@/hooks/useWhatsAppReceiver"
import packageJson from "@/package.json"
import { Clock, MapPin, Route, Map, Circle, RefreshCw } from "lucide-react"
import { LocationPreset } from "@/types/app"
import { useGeofences, Geofence } from "@/hooks/useGeofences"

const MapPanel = dynamic(() => import("@/components/phone/MapPanel"), { ssr: false })

interface TimePreset {
  id: string
  label: string
  description?: string
  type: "absolute" | "relative"
  absoluteDate?: string
  relativeAmount?: number
  relativeUnit?: "minutes" | "hours" | "days" | "weeks"
}

function PhoneEmulator() {
  const sessionId = useSMSReceiver()
  const { addSMS, setTimeOffset, timeOffset, setLocationOverrideConfig, phoneNumber, setPhoneNumber, closeApp } = usePhone()
  const [isLoaded, setIsLoaded] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const timeDropdownRef = useRef<HTMLDivElement>(null)
  const [timePresets, setTimePresets] = useState<TimePreset[]>([])
  const [locationPresets, setLocationPresets] = useState<LocationPreset[]>([])
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const locationDropdownRef = useRef<HTMLDivElement>(null)
  const { geofences, refetch: refetchGeofences, isLoading: isGeofencesLoading } = useGeofences()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Escape key closes current app
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeApp()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeApp])

  // Connect to email SSE stream
  useEmailReceiver(phoneNumber && phoneNumber !== "skip" ? phoneNumber : null)

  // Connect to WhatsApp SSE stream
  useWhatsAppReceiver(phoneNumber && phoneNumber !== "skip" ? phoneNumber : null)

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    // Use a microtask to avoid the lint warning
    Promise.resolve().then(() => {
      const stored = localStorage.getItem("phone-number")
      setPhoneNumber(stored)
      setIsLoaded(true)
    })
  }, [])

  // Save phone number to localStorage when it changes
  useEffect(() => {
    if (phoneNumber && isLoaded) {
      localStorage.setItem("phone-number", phoneNumber)
    }
  }, [phoneNumber, isLoaded])

  // Close all SSE connections on page unload (refresh/navigate)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Connect to SSE stream for remote SMS messages when logged in with a phone number
  useEffect(() => {
    if (!phoneNumber || phoneNumber === "skip" || !isLoaded) return

    let isMounted = true

    // Close existing connection if any and wait for cleanup
    const connectToStream = async () => {
      if (eventSourceRef.current) {
        console.log("[SSE] Closing existing connection before creating new one")
        eventSourceRef.current.close()
        eventSourceRef.current = null
        // Wait longer for server-side cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (!isMounted) return

      // Delay SSE connection to allow other HTTP requests to complete first
      // This prevents connection exhaustion in browsers (6 connection limit per origin)
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!isMounted) return

      console.log(`[SSE] Connecting to stream for ${phoneNumber}`)

      const eventSource = new EventSource(`/api/sms/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("[SSE] Connection established")
      }

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            console.log(`[SSE] Connected to phone number: ${data.phoneNumber}`)
            return
          }

          // Received SMS message
          if (data.sender && data.message) {
            console.log(`[SSE] Received message from ${data.sender}`)
            addSMS({ sender: data.sender, message: data.message })
          }
        } catch (error) {
          console.error("[SSE] Failed to parse message:", error)
        }
      }

      eventSource.onerror = error => {
        console.error("[SSE] Connection error:", error)
        // EventSource automatically reconnects
      }
    }

    connectToStream()

    // Cleanup on unmount or phone number change
    return () => {
      isMounted = false
      if (eventSourceRef.current) {
        console.log("[SSE] Closing connection")
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber, isLoaded]) // Removed addSMS to prevent re-renders

  const handleLogin = (number: string) => {
    setPhoneNumber(number || "skip") // "skip" means no phone number (anonymous mode)
  }

  const handleLogout = () => {
    setPhoneNumber(null)
    localStorage.removeItem("phone-number")
  }

  const handleOpenTester = () => {
    const testerUrl = `/tester?session=${encodeURIComponent(sessionId)}`
    window.open(testerUrl, "_blank")
    setIsDropdownOpen(false)
  }

  const handleOpenEmailTester = () => {
    window.open("/email-tester", "_blank")
    setIsDropdownOpen(false)
  }

  const handleOpenWhatsAppTester = () => {
    window.open("/whatsapp-tester", "_blank")
    setIsDropdownOpen(false)
  }

  const handleOpenTimeConfig = () => {
    window.open("/time-config", "_blank")
    setIsDropdownOpen(false)
  }

  const handleTimePresetSelect = (preset: TimePreset) => {
    let offset = 0

    if (preset.type === "absolute" && preset.absoluteDate) {
      const targetDate = new Date(preset.absoluteDate)
      offset = targetDate.getTime() - Date.now()
    } else if (preset.type === "relative" && preset.relativeAmount && preset.relativeUnit) {
      const unitMultipliers = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
      }
      offset = preset.relativeAmount * unitMultipliers[preset.relativeUnit]
    }

    setTimeOffset(offset)
    setIsTimeDropdownOpen(false)
  }

  const handleResetTime = () => {
    setTimeOffset(0)
    setIsTimeDropdownOpen(false)
  }

  const handleResetLocation = () => {
    setLocationOverrideConfig({ enabled: false })
    setIsLocationDropdownOpen(false)
  }

  const handleRefreshLocations = async () => {
    setIsRefreshing(true)
    // Refetch location presets from API (in case config page updated them)
    try {
      const response = await fetch("/api/location-presets")
      if (response.ok) {
        const data = await response.json()
        setLocationPresets(data.data)
      }
    } catch (error) {
      console.error("Failed to reload location presets:", error)
    }
    // Refetch geofences from API
    refetchGeofences()
    // Small delay to show feedback
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsRefreshing(false)
  }

  const handleGeofenceSelect = (geofence: Geofence) => {
    // Calculate centroid of polygon
    const centroid = geofence.coordinates.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat / geofence.coordinates.length,
        lng: acc.lng + coord.lng / geofence.coordinates.length,
      }),
      { lat: 0, lng: 0 }
    )

    setLocationOverrideConfig({
      enabled: true,
      mode: "static",
      staticPosition: {
        latitude: centroid.lat,
        longitude: centroid.lng,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    })
    setIsLocationDropdownOpen(false)
  }

  const handleLocationPresetSelect = (preset: LocationPreset) => {
    if (preset.type === "static" && preset.latitude !== undefined && preset.longitude !== undefined) {
      setLocationOverrideConfig({
        enabled: true,
        mode: "static",
        staticPosition: {
          latitude: preset.latitude,
          longitude: preset.longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
      })
    } else if (preset.type === "route" && preset.waypoints && preset.waypoints.length > 0) {
      setLocationOverrideConfig({
        enabled: true,
        mode: "route",
        route: {
          id: preset.id,
          name: preset.name,
          waypoints: preset.waypoints,
          currentWaypointIndex: 0,
          progress: 0,
          isPlaying: false,
          loop: false,
        },
      })
    }
    setIsLocationDropdownOpen(false)
  }

  const handleOpenLocationConfig = () => {
    window.open("/location-config", "_blank")
    setIsDropdownOpen(false)
  }

  // Load time presets from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("phone-time-presets")
    if (stored) {
      try {
        setTimePresets(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to load time presets:", error)
      }
    }
  }, [])

  // Load location presets from API
  useEffect(() => {
    const fetchLocationPresets = async () => {
      try {
        const response = await fetch("/api/location-presets")
        if (!response.ok) throw new Error("Failed to fetch presets")
        const data = await response.json()
        setLocationPresets(data.data)
      } catch (error) {
        console.error("Failed to load location presets:", error)
        setLocationPresets([])
      }
    }

    fetchLocationPresets()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false)
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Show loading state during hydration
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (phoneNumber === null) {
    return <PhoneNumberLogin onLogin={handleLogin} />
  }

  // Anonymous mode (skipped login)
  const isAnonymous = phoneNumber === "skip"
  const displayPhoneNumber = isAnonymous ? null : phoneNumber

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 p-8 gap-8">
      <div className="phone-emulator">
        <Phone />
      </div>

      {/* Map Panel */}
      {isMapVisible && (
        <div className="w-[500px] h-[875px]">
          <MapPanel />
        </div>
      )}

      {/* Version indicator */}
      <div className="fixed bottom-4 right-4 text-gray-400 text-xs font-mono">v{packageJson.version}</div>

        {/* Control buttons (Time, Location, Map) */}
        <div className="fixed top-4 left-4 z-50 flex items-start gap-3">
          {/* Time Selector */}
          <div className="relative" ref={timeDropdownRef}>
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className={`bg-white rounded-lg shadow-lg p-2 transition-colors ${
                timeOffset !== 0
                  ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title={timeOffset !== 0 ? "Time override active - click to change" : "Set time for demo"}>
              <Clock className="w-5 h-5" />
            </button>

            {/* Time Preset Dropdown */}
            {isTimeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Time Travel</div>
                </div>

                {/* Reset to Now */}
                <button
                  onClick={handleResetTime}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                    timeOffset === 0 ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}>
                  <Clock className="w-4 h-4" />
                  <span>Now (Real Time)</span>
                </button>

                {timePresets.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    {timePresets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleTimePresetSelect(preset)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        title={preset.description}>
                        <div className="font-medium">{preset.label}</div>
                        {preset.description && <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>}
                      </button>
                    ))}
                  </>
                )}

                {timePresets.length === 0 && (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center">
                    No presets configured.
                    <br />
                    Open Time Travel Config to add presets.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Selector */}
          <div className="relative" ref={locationDropdownRef}>
            <button
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              className="bg-white rounded-lg shadow-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Set location for demo">
              <MapPin className="w-5 h-5" />
            </button>

            {/* Location Preset Dropdown */}
            {isLocationDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Location Override</div>
                  <button
                    onClick={handleRefreshLocations}
                    disabled={isRefreshing}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Refresh locations">
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Reset to Real GPS */}
                <button
                  onClick={handleResetLocation}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Real GPS</span>
                </button>

                {/* Routes Section */}
                {locationPresets.filter(p => p.type === "route").length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <div className="px-3 py-1.5">
                      <div className="text-xs font-semibold text-gray-400 uppercase">Routes</div>
                    </div>
                    {locationPresets
                      .filter(preset => preset.type === "route")
                      .map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handleLocationPresetSelect(preset)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          title={preset.description}>
                          <Route className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <div className="font-medium">{preset.name}</div>
                            {preset.description && <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>}
                          </div>
                        </button>
                      ))}
                  </>
                )}

                {/* Static Locations Section */}
                {locationPresets.filter(p => p.type === "static").length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <div className="px-3 py-1.5">
                      <div className="text-xs font-semibold text-gray-400 uppercase">Locations</div>
                    </div>
                    {locationPresets
                      .filter(preset => preset.type === "static")
                      .map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handleLocationPresetSelect(preset)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          title={preset.description}>
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium">{preset.name}</div>
                            {preset.description && <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>}
                          </div>
                        </button>
                      ))}
                  </>
                )}

                {/* Geofences Section */}
                {geofences.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <div className="px-3 py-1.5">
                      <div className="text-xs font-semibold text-gray-400 uppercase">Geofences</div>
                    </div>
                    {geofences.map(geofence => (
                      <button
                        key={geofence.id}
                        onClick={() => handleGeofenceSelect(geofence)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        title={`${geofence.coordinates.length} vertices`}>
                        <Circle className="w-4 h-4 text-purple-600" />
                        <div className="flex-1">
                          <div className="font-medium">{geofence.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{geofence.coordinates.length} vertices</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Empty state */}
                {locationPresets.length === 0 && geofences.length === 0 && (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center">
                    No locations configured.
                    <br />
                    Open Location Config to add presets.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsMapVisible(!isMapVisible)}
              className={`bg-white rounded-lg shadow-lg p-2 transition-colors ${
                isMapVisible
                  ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title={isMapVisible ? "Hide map viewer" : "Show map viewer"}>
              <Map className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Phone Number & Tester Dropdown */}
        <div className="fixed top-4 right-4 flex items-center gap-3">
          {/* Phone Number Display - only show if logged in with a number */}
          {displayPhoneNumber && (
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <span className="font-mono font-medium text-gray-900">{displayPhoneNumber}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Logout">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Anonymous mode indicator */}
          {isAnonymous && (
            <div className="bg-gray-100 rounded-lg shadow-lg px-4 py-2 text-sm flex items-center gap-2">
              <span className="text-gray-600">Local Mode</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-blue-600 transition-colors text-xs underline"
                title="Login with phone number">
                Login
              </button>
            </div>
          )}

          {/* Tester Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Open testing tools">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <svg
                className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={handleOpenTester}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  SMS Tester
                </button>
                <button
                  onClick={handleOpenEmailTester}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email Tester
                </button>
                <button
                  onClick={handleOpenWhatsAppTester}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp Tester
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={handleOpenTimeConfig}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Time Travel Config
                </button>
                <button
                  onClick={handleOpenLocationConfig}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    />
                  </svg>
                  Location Config
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

export default function Home() {
  return (
    <GeofenceAppsProvider>
      <PhoneProvider>
        <PhoneEmulator />
      </PhoneProvider>
    </GeofenceAppsProvider>
  )
}
