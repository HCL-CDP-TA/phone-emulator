"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { Notification } from "@/types/app"

export default function NotificationBanner() {
  const { notifications, dismissNotification, openApp } = usePhone()
  const [visibleAppId, setVisibleAppId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Group notifications by appId
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, Notification[]>()
    notifications.forEach((notification) => {
      const appId = notification.appId
      if (!groups.has(appId)) {
        groups.set(appId, [])
      }
      groups.get(appId)!.push(notification)
    })
    return groups
  }, [notifications])

  // Get the latest app group to show
  const latestAppId = useMemo(() => {
    if (notifications.length === 0) return null
    return notifications[0].appId
  }, [notifications])

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

  // Show notification when a new one arrives
  useEffect(() => {
    if (latestAppId && !visibleAppId) {
      queueMicrotask(() => {
        setVisibleAppId(latestAppId)
        setExpanded(false)

        // Auto-hide after 5 seconds if not expanded
        timerRef.current = setTimeout(() => {
          if (!expanded) {
            setVisibleAppId(null)
          }
        }, 5000)
      })
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [latestAppId, visibleAppId, expanded])

  // Update visible app if current group is fully dismissed
  useEffect(() => {
    if (visibleAppId && !groupedNotifications.has(visibleAppId)) {
      setVisibleAppId(null)
      setExpanded(false)
    }
  }, [visibleAppId, groupedNotifications])

  const handleActionButtonClick = useCallback((e: React.MouseEvent, url: string, notificationId: string, appId: string) => {
    e.stopPropagation()
    if (url) {
      localStorage.setItem(`app-navigate-${appId}`, url)
      window.dispatchEvent(new CustomEvent("app-navigate", { detail: { appId, url } }))
      openApp(appId)
    }
    dismissNotification(notificationId)
  }, [openApp, dismissNotification])

  const currentGroup = visibleAppId ? groupedNotifications.get(visibleAppId) : null

  if (!currentGroup || currentGroup.length === 0) return null

  const latestInGroup = currentGroup[0]
  const groupCount = currentGroup.length

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (groupCount > 1) {
      setExpanded(!expanded)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = undefined
      }
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.onClick) {
      notification.onClick()
    }
    dismissNotification(notification.id)
  }

  const handleDismissNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    dismissNotification(notificationId)
  }

  const handleDismissAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    currentGroup.forEach(n => dismissNotification(n.id))
    setVisibleAppId(null)
    setExpanded(false)
  }

  return (
    <div className="absolute top-12 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header / First notification */}
        <div
          onClick={() => !expanded && handleNotificationClick(latestInGroup)}
          className={`p-4 ${!expanded && groupCount === 1 ? "cursor-pointer active:scale-95" : ""} transition-transform`}>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-10 h-10 ${latestInGroup.iconColor || "bg-gray-500"} rounded-full flex items-center justify-center text-white p-2`}>
              {latestInGroup.icon || (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">{latestInGroup.appName}</span>
                <div className="flex items-center gap-2">
                  {groupCount > 1 && !expanded && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {groupCount}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(latestInGroup.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              {!expanded ? (
                <>
                  <p className="font-semibold text-sm mb-0.5">{latestInGroup.title}</p>
                  <p className="text-sm text-gray-900 line-clamp-2">{shortenMessage(latestInGroup.message)}</p>
                  {latestInGroup.imageUrl && !failedImages.has(latestInGroup.id) && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={latestInGroup.imageUrl}
                        alt=""
                        className="w-full h-32 object-cover rounded-lg"
                        onError={() => setFailedImages(prev => new Set(prev).add(latestInGroup.id))}
                      />
                    </div>
                  )}
                  {latestInGroup.actionButtons && latestInGroup.actionButtons.length > 0 && (
                    <div className="flex justify-center gap-4 mt-2">
                      {latestInGroup.actionButtons.map(btn => (
                        <button
                          key={btn.id}
                          onClick={(e) => handleActionButtonClick(e, btn.url, latestInGroup.id, latestInGroup.appId)}
                          className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors">
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {groupCount > 1 && (
                    <button
                      onClick={handleToggleExpand}
                      className="text-xs text-blue-500 hover:text-blue-600 mt-2 font-medium">
                      Show {groupCount - 1} more
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleToggleExpand}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                  Collapse
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {groupCount > 1 && expanded ? (
                <button
                  onClick={handleDismissAll}
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                  title="Dismiss all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={(e) => handleDismissNotification(e, latestInGroup.id)}
                  className="shrink-0 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded list of notifications */}
        {expanded && groupCount > 1 && (
          <div className="border-t border-gray-100 max-h-80 overflow-y-auto">
            {currentGroup.map((notification, index) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${
                  index < groupCount - 1 ? "border-b border-gray-100" : ""
                }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {shortenMessage(notification.message)}
                    </p>
                    {notification.imageUrl && !failedImages.has(notification.id) && (
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <img
                          src={notification.imageUrl}
                          alt=""
                          className="w-full h-32 object-cover rounded-lg"
                          onError={() => setFailedImages(prev => new Set(prev).add(notification.id))}
                        />
                      </div>
                    )}
                    {notification.actionButtons && notification.actionButtons.length > 0 && (
                      <div className="flex justify-center gap-4 mt-2">
                        {notification.actionButtons.map(btn => (
                          <button
                            key={btn.id}
                            onClick={(e) => handleActionButtonClick(e, btn.url, notification.id, notification.appId)}
                            className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors">
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDismissNotification(e, notification.id)}
                    className="shrink-0 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
