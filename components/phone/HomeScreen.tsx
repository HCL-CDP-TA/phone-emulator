"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { appRegistry } from "@/lib/appRegistry"

export default function HomeScreen() {
  const { openApp, currentTime } = usePhone()

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
        {appRegistry.map(app => (
          <button
            key={app.id}
            onClick={() => openApp(app.id)}
            className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
            <div
              className={`w-14 h-14 ${app.iconColor} rounded-full flex items-center justify-center text-white shadow-lg p-3`}>
              {app.icon}
            </div>
            <span className="text-white text-xs font-medium text-center leading-tight drop-shadow">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
