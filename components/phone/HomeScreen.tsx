"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { useAppRegistry } from "@/lib/appRegistry"
import { useGeofenceApps } from "@/contexts/GeofenceAppsContext"

export default function HomeScreen() {
  const { openApp, currentTime, geofenceMonitoring } = usePhone()
  const appRegistry = useAppRegistry()
  const { apps: geofenceApps } = useGeofenceApps()

  // Limit to 24 apps (4 columns × 6 rows) to fit on screen
  // Apps beyond this limit (dummy apps at bottom of registry) are hidden
  const MAX_APPS = 24
  const visibleApps = appRegistry.slice(0, MAX_APPS)

  // Helper to check if an app is actively tracking location
  const isAppTracking = (appId: string) => {
    // Check if it's the test GeofenceApp with monitoring enabled
    if (appId === "geofence") {
      return geofenceMonitoring
    }
    // Check if it's a geofence webview app with tracking enabled
    const geofenceApp = geofenceApps.find(app => app.id === appId)
    return geofenceApp?.geotrackingEnabled || false
  }

  // Format time: e.g., "2:30 PM"
  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

  // Split time and AM/PM for separate styling (handles AM, PM, a.m., p.m., etc.)
  const timeMatch = formattedTime.match(/^(.+?)\s*(AM|PM|am|pm|a\.m\.|p\.m\.|A\.M\.|P\.M\.)?$/i)
  const timePart = timeMatch ? timeMatch[1] : formattedTime
  const ampmPart = timeMatch ? timeMatch[2] : null

  // Format date: e.g., "Friday, December 5"
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-col h-full bg-linear-to-b from-blue-400 to-purple-500 p-6 pt-10">
      {/* Date/Time Display */}
      <div className="text-center text-white mb-8">
        <div className="leading-none tracking-tight drop-shadow-lg font-light flex items-start justify-center gap-2">
          <span className="text-9xl">{timePart}</span>
          {ampmPart && <span className="text-2xl mt-2 opacity-80">{ampmPart}</span>}
        </div>
        <div className="text-2xl font-medium mt-2 drop-shadow">{formattedDate}</div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-4 gap-4 auto-rows-min">
        {visibleApps.map(app => (
          <button
            key={app.id}
            onClick={() => openApp(app.id)}
            className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
            <div className="relative">
              <div
                className={`w-14 h-14 ${app.iconColor} rounded-full flex items-center justify-center text-white shadow-lg p-3`}>
                {app.icon}
              </div>
              {/* Location Tracking Indicator */}
              {isAppTracking(app.id) && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-white text-xs font-medium text-center leading-tight drop-shadow">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
