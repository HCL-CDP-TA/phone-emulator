"use client"

import { useState } from "react"
import { usePhone } from "@/contexts/PhoneContext"

export default function StatusBar() {
  const { currentTime, timeOffset, locationOverride, geofenceMonitoring } = usePhone()
  const [battery] = useState(87)

  return (
    <div className="flex items-center justify-between px-6 py-2 text-white text-sm font-medium">
      {/* Time */}
      <div className="flex-1 flex items-center gap-1.5">
        {currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        {timeOffset !== 0 && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" title="Time override active" />}
        {locationOverride.enabled && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Location override active" />}
      </div>

      {/* Center indicators (notch area) */}
      <div className="flex items-center gap-1">
        <div className="w-20 h-6 bg-black rounded-b-3xl flex items-center justify-center">
          <div className="w-12 h-1.5 bg-gray-800 rounded-full" />
        </div>
      </div>

      {/* Right status icons */}
      <div className="flex-1 flex items-center justify-end gap-1.5">
        {/* Geofence monitoring indicator */}
        {geofenceMonitoring && (
          <svg className="w-4 h-4 text-green-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        )}
        {/* Signal strength */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 22h3V10H2v12zm19-12h-3v12h3V10zm-7 12h3V2h-3v20zM7 22h3V6H7v16z" />
        </svg>
        {/* WiFi */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <span className="text-xs">{battery}%</span>
          <svg className="w-6 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="7" width="18" height="10" rx="2" strokeWidth="2" />
            <path d="M20 10h2v4h-2" strokeWidth="2" strokeLinecap="round" />
            <rect x="4" y="9" width={`${(battery / 100) * 14}`} height="6" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  )
}
