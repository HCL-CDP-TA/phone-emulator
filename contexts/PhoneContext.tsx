"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"
import { Notification, SMS, LocationState } from "@/types/app"

interface PhoneContextType {
  activeApp: string | null
  openApp: (appId: string) => void
  closeApp: () => void
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  dismissNotification: (id: string) => void
  smsMessages: SMS[]
  addSMS: (sms: Omit<SMS, "id" | "timestamp" | "read">) => void
  markSMSAsRead: (id: string) => void
  deleteConversation: (sender: string) => void
  location: LocationState
  requestLocation: () => void
  watchLocation: () => number | null
  clearLocationWatch: (watchId: number) => void
}

const PhoneContext = createContext<PhoneContextType | undefined>(undefined)

// Load SMS from localStorage
function loadSMSFromStorage(): SMS[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("phone-sms-messages")
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert timestamp strings back to Date objects and deduplicate
      const messages = parsed.map((sms: SMS) => ({
        ...sms,
        timestamp: new Date(sms.timestamp),
      }))

      // Deduplicate messages with same ID (keep the first occurrence)
      const seen = new Set<string>()
      const deduped = messages.filter((sms: SMS) => {
        if (seen.has(sms.id)) {
          return false
        }
        seen.add(sms.id)
        return true
      })

      // If duplicates were found, regenerate IDs for safety
      if (deduped.length < messages.length) {
        console.warn("Duplicate message IDs found, regenerating...")
        return deduped.map((sms: SMS) => ({
          ...sms,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        }))
      }

      return deduped
    }
  } catch (error) {
    console.error("Failed to load SMS from localStorage:", error)
  }
  return []
}

// Save SMS to localStorage
function saveSMSToStorage(messages: SMS[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("phone-sms-messages", JSON.stringify(messages))
  } catch (error) {
    console.error("Failed to save SMS to localStorage:", error)
  }
}

export function PhoneProvider({ children }: { children: ReactNode }) {
  const [activeApp, setActiveApp] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [smsMessages, setSmsMessages] = useState<SMS[]>(() => loadSMSFromStorage())
  const [location, setLocation] = useState<LocationState>({
    position: null,
    error: null,
    isLoading: false,
    hasPermission: null,
  })

  const openApp = useCallback((appId: string) => {
    setActiveApp(appId)
  }, [])

  const closeApp = useCallback(() => {
    setActiveApp(null)
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addSMS = useCallback(
    (sms: Omit<SMS, "id" | "timestamp" | "read">) => {
      const newSMS: SMS = {
        ...sms,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(),
        read: false,
      }

      // Check for duplicate message (same sender and message within last second)
      setSmsMessages(prev => {
        const recentDuplicate = prev.find(
          existingSms =>
            existingSms.sender === newSMS.sender &&
            existingSms.message === newSMS.message &&
            new Date(existingSms.timestamp).getTime() > Date.now() - 1000,
        )

        // If duplicate found, don't add it
        if (recentDuplicate) {
          console.log("Duplicate SMS detected, skipping")
          return prev
        }

        return [newSMS, ...prev]
      })

      // Also create a notification
      addNotification({
        appId: "messages",
        appName: "Messages",
        title: sms.sender,
        message: sms.message,
        data: { smsId: newSMS.id },
        onClick: () => {
          openApp("messages")
        },
      })
    },
    [addNotification, openApp],
  )

  const markSMSAsRead = useCallback((id: string) => {
    setSmsMessages(prev => prev.map(sms => (sms.id === id ? { ...sms, read: true } : sms)))
  }, [])

  const deleteConversation = useCallback((sender: string) => {
    setSmsMessages(prev => prev.filter(sms => sms.sender !== sender))
  }, [])

  // Request location once
  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: {
          code: 2,
          message: "Geolocation is not supported by this browser",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
        hasPermission: false,
      }))
      return
    }

    setLocation(prev => ({ ...prev, isLoading: true }))

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          position,
          error: null,
          isLoading: false,
          hasPermission: true,
        })
      },
      error => {
        setLocation({
          position: null,
          error,
          isLoading: false,
          hasPermission: error.code === 1 ? false : null,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [])

  // Watch location continuously
  const watchLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      position => {
        setLocation(prev => ({
          ...prev,
          position,
          error: null,
          isLoading: false,
          hasPermission: true,
        }))
      },
      error => {
        setLocation(prev => ({
          ...prev,
          error,
          isLoading: false,
          hasPermission: error.code === 1 ? false : null,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    return watchId
  }, [])

  // Clear location watch
  const clearLocationWatch = useCallback((watchId: number) => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Persist SMS messages to localStorage whenever they change
  useEffect(() => {
    saveSMSToStorage(smsMessages)
  }, [smsMessages])

  // Request location on mount to make it available to all apps
  useEffect(() => {
    // Only request once on initial mount
    if (typeof window === "undefined" || !navigator.geolocation) return

    // Use setTimeout to avoid cascading render warning
    const timeoutId = setTimeout(() => {
      if (navigator.geolocation) {
        setLocation(prev => ({ ...prev, isLoading: true }))

        navigator.geolocation.getCurrentPosition(
          position => {
            setLocation({
              position,
              error: null,
              isLoading: false,
              hasPermission: true,
            })
          },
          error => {
            setLocation({
              position: null,
              error,
              isLoading: false,
              hasPermission: error.code === 1 ? false : null,
            })
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        )
      }
    }, 0)

    return () => clearTimeout(timeoutId)
    // Empty dependency array - only run once on mount
  }, [])

  return (
    <PhoneContext.Provider
      value={{
        activeApp,
        openApp,
        closeApp,
        notifications,
        addNotification,
        dismissNotification,
        smsMessages,
        addSMS,
        markSMSAsRead,
        deleteConversation,
        location,
        requestLocation,
        watchLocation,
        clearLocationWatch,
      }}>
      {children}
    </PhoneContext.Provider>
  )
}

export function usePhone() {
  const context = useContext(PhoneContext)
  if (context === undefined) {
    throw new Error("usePhone must be used within a PhoneProvider")
  }
  return context
}
