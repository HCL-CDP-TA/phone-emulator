"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { useEffect, useState, useRef } from "react"

export default function NotificationBanner() {
  const { notifications, dismissNotification } = usePhone()
  const [visible, setVisible] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const shortenUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname === "uni.ca") {
        return url.replace(/^https?:\/\//, "")
      }
      const domain = urlObj.hostname.replace("www.", "")
      const path = urlObj.pathname + urlObj.search
      if (domain.length + path.length <= 25) {
        return domain + path
      }
      const hash = Math.abs(
        url.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0),
      )
      const shortCode = hash.toString(36).substring(0, 6)
      return `uni.ca/${shortCode}`
    } catch {
      return url
    }
  }

  const shortenMessage = (text: string): string => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, url => shortenUrl(url))
  }

  useEffect(() => {
    if (notifications.length > 0 && !visible) {
      const latest = notifications[0]

      // Use a microtask to avoid cascading renders
      queueMicrotask(() => {
        setVisible(latest.id)

        // Auto-dismiss after 5 seconds
        timerRef.current = setTimeout(() => {
          setVisible(null)
        }, 5000)
      })
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [notifications, visible])

  const latestNotification = notifications.find(n => n.id === visible)

  if (!latestNotification) return null

  const handleClick = () => {
    if (latestNotification.onClick) {
      latestNotification.onClick()
    }
    dismissNotification(latestNotification.id)
    setVisible(null)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    dismissNotification(latestNotification.id)
    setVisible(null)
  }

  return (
    <div className="absolute top-12 left-4 right-4 z-50 animate-slide-down">
      <div
        onClick={handleClick}
        className="bg-white rounded-2xl shadow-2xl p-4 cursor-pointer active:scale-95 transition-transform">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 ${latestNotification.iconColor || "bg-gray-500"} rounded-lg flex items-center justify-center text-white p-2`}>
            {latestNotification.icon || (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{latestNotification.appName}</span>
              <span className="text-xs text-gray-500">
                {new Date(latestNotification.timestamp).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="font-medium text-sm mb-0.5">{latestNotification.title}</p>
            <p className="text-sm text-gray-600 line-clamp-2">{shortenMessage(latestNotification.message)}</p>
          </div>
          <button onClick={handleDismiss} className="shrink-0 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
