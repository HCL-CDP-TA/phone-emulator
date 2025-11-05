"use client"

import { AppProps } from "@/types/app"
import { useEffect, useState } from "react"

export default function ClockApp({ onClose }: AppProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white hover:text-gray-300 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Clock</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl font-light mb-2">
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-xl opacity-70">
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  )
}
