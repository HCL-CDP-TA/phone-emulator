"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { appRegistry } from "@/lib/appRegistry"

export default function HomeScreen() {
  const { openApp } = usePhone()

  return (
    <div className="flex flex-col h-full bg-linear-to-b from-blue-400 to-purple-500 p-6 pt-20">
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
