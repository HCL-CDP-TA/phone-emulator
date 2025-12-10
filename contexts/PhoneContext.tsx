"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef, useMemo } from "react"
import { Notification, SMS, Email, WhatsAppMessage, LocationState, LocationOverride } from "@/types/app"
import { getAppById } from "@/lib/appRegistry"
import { calculateHeading } from "@/lib/locationUtils"

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
  emailMessages: Email[]
  addEmail: (email: Omit<Email, "id" | "timestamp" | "read">) => void
  markEmailAsRead: (id: string) => void
  deleteEmail: (id: string) => void
  whatsappMessages: WhatsAppMessage[]
  addWhatsApp: (message: Omit<WhatsAppMessage, "id" | "timestamp" | "read">) => void
  markWhatsAppAsRead: (id: string) => void
  deleteWhatsAppConversation: (sender: string) => void
  location: LocationState
  effectiveLocation: GeolocationPosition | null
  requestLocation: () => void
  watchLocation: () => number | null
  clearLocationWatch: (watchId: number) => void
  currentTime: Date
  timeOffset: number
  setTimeOffset: (offset: number) => void
  locationOverride: LocationOverride
  setLocationOverrideConfig: (config: Partial<LocationOverride>) => void
  broadcastLocationToIframes: () => void
  phoneNumber: string | null
  setPhoneNumber: (phoneNumber: string | null) => void
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

// Load Email from localStorage
function loadEmailFromStorage(): Email[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("phone-email-messages")
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return parsed.map((email: Email) => ({
        ...email,
        timestamp: new Date(email.timestamp),
      }))
    }
  } catch (error) {
    console.error("Failed to load email from localStorage:", error)
  }
  return []
}

// Save Email to localStorage
function saveEmailToStorage(messages: Email[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("phone-email-messages", JSON.stringify(messages))
  } catch (error) {
    console.error("Failed to save email to localStorage:", error)
  }
}

// Load WhatsApp from localStorage
function loadWhatsAppFromStorage(): WhatsAppMessage[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("phone-whatsapp-messages")
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return parsed.map((message: WhatsAppMessage) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }))
    }
  } catch (error) {
    console.error("Failed to load WhatsApp from localStorage:", error)
  }
  return []
}

// Save WhatsApp to localStorage
function saveWhatsAppToStorage(messages: WhatsAppMessage[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("phone-whatsapp-messages", JSON.stringify(messages))
  } catch (error) {
    console.error("Failed to save WhatsApp to localStorage:", error)
  }
}

export function PhoneProvider({ children }: { children: ReactNode }) {
  const [activeApp, setActiveApp] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [smsMessages, setSmsMessages] = useState<SMS[]>(() => loadSMSFromStorage())
  const [emailMessages, setEmailMessages] = useState<Email[]>(() => loadEmailFromStorage())
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>(() => loadWhatsAppFromStorage())
  const [location, setLocation] = useState<LocationState>({
    position: null,
    error: null,
    isLoading: false,
    hasPermission: null,
  })

  // Location override state
  const [locationOverride, setLocationOverride] = useState<LocationOverride>({
    enabled: false,
    mode: "static",
  })

  // BroadcastChannel for location updates
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // Time management state (not persisted - reverts to real time on refresh)
  const [timeOffset, setTimeOffsetState] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<Date>(new Date(Date.now() + timeOffset))

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)

  const openApp = useCallback((appId: string) => {
    setActiveApp(appId)
  }, [])

  const closeApp = useCallback(() => {
    setActiveApp(null)
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(currentTime),
      }
      setNotifications(prev => [newNotification, ...prev])
    },
    [currentTime],
  )

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addSMS = useCallback(
    (sms: Omit<SMS, "id" | "timestamp" | "read">) => {
      const newSMS: SMS = {
        ...sms,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(currentTime),
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
      const messagesApp = getAppById("messages")
      addNotification({
        appId: "messages",
        appName: "Messages",
        title: sms.sender,
        message: sms.message,
        icon: messagesApp?.icon,
        iconColor: messagesApp?.iconColor,
        data: { smsId: newSMS.id },
        onClick: () => {
          openApp("messages")
        },
      })
    },
    [addNotification, openApp, currentTime],
  )

  const markSMSAsRead = useCallback((id: string) => {
    setSmsMessages(prev => prev.map(sms => (sms.id === id ? { ...sms, read: true } : sms)))
  }, [])

  const deleteConversation = useCallback((sender: string) => {
    setSmsMessages(prev => prev.filter(sms => sms.sender !== sender))
  }, [])

  const addEmail = useCallback(
    (email: Omit<Email, "id" | "timestamp" | "read">) => {
      const newEmail: Email = {
        ...email,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(currentTime),
        read: false,
      }

      // Check for duplicate email (same from and subject within last second)
      setEmailMessages(prev => {
        const recentDuplicate = prev.find(
          existingEmail =>
            existingEmail.from === newEmail.from &&
            existingEmail.subject === newEmail.subject &&
            new Date(existingEmail.timestamp).getTime() > Date.now() - 1000,
        )

        // If duplicate found, don't add it
        if (recentDuplicate) {
          console.log("Duplicate email detected, skipping")
          return prev
        }

        return [newEmail, ...prev]
      })

      // Also create a notification
      const emailApp = getAppById("email")
      addNotification({
        appId: "email",
        appName: "Mail",
        title: email.from,
        message: email.subject,
        icon: emailApp?.icon,
        iconColor: emailApp?.iconColor,
        data: { emailId: newEmail.id },
        onClick: () => {
          openApp("email")
        },
      })
    },
    [addNotification, openApp, currentTime],
  )

  const markEmailAsRead = useCallback((id: string) => {
    setEmailMessages(prev => prev.map(email => (email.id === id ? { ...email, read: true } : email)))
  }, [])

  const deleteEmail = useCallback((id: string) => {
    setEmailMessages(prev => prev.filter(email => email.id !== id))
  }, [])

  const addWhatsApp = useCallback(
    (message: Omit<WhatsAppMessage, "id" | "timestamp" | "read">) => {
      const newMessage: WhatsAppMessage = {
        ...message,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(currentTime),
        read: false,
      }

      // Check for duplicate message (same sender and message within last second)
      setWhatsappMessages(prev => {
        const recentDuplicate = prev.find(
          existingMessage =>
            existingMessage.sender === newMessage.sender &&
            existingMessage.message === newMessage.message &&
            new Date(existingMessage.timestamp).getTime() > Date.now() - 1000,
        )

        // If duplicate found, don't add it
        if (recentDuplicate) {
          console.log("Duplicate WhatsApp message detected, skipping")
          return prev
        }

        return [newMessage, ...prev]
      })

      // Also create a notification
      const whatsappApp = getAppById("whatsapp")
      addNotification({
        appId: "whatsapp",
        appName: "WhatsApp",
        title: message.sender,
        message: message.message,
        icon: whatsappApp?.icon,
        iconColor: whatsappApp?.iconColor,
        data: { messageId: newMessage.id },
        onClick: () => {
          openApp("whatsapp")
        },
      })
    },
    [addNotification, openApp, currentTime],
  )

  const markWhatsAppAsRead = useCallback((id: string) => {
    setWhatsappMessages(prev => prev.map(message => (message.id === id ? { ...message, read: true } : message)))
  }, [])

  const deleteWhatsAppConversation = useCallback((sender: string) => {
    setWhatsappMessages(prev => prev.filter(message => message.sender !== sender))
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

  // Get effective location (override if enabled, otherwise real GPS)
  const getEffectiveLocation = useCallback((): GeolocationPosition | null => {
    if (!locationOverride.enabled) {
      return location.position
    }

    // For both static and route modes, if staticPosition is set, use it (for interpolated route positions)
    if (locationOverride.staticPosition) {
      const pos = locationOverride.staticPosition
      return {
        coords: {
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy ?? 10,
          altitude: pos.altitude ?? null,
          altitudeAccuracy: pos.altitudeAccuracy ?? null,
          heading: pos.heading ?? null,
          speed: pos.speed ?? null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition
    }

    // Fallback for route mode when no interpolation has happened yet
    if (locationOverride.mode === "route" && locationOverride.route) {
      const route = locationOverride.route
      const currentWaypoint = route.waypoints[route.currentWaypointIndex]
      if (!currentWaypoint) return location.position

      return {
        coords: {
          latitude: currentWaypoint.latitude,
          longitude: currentWaypoint.longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: currentWaypoint.speed ?? null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition
    }

    return location.position
  }, [locationOverride, location.position])

  // Set location override configuration
  const setLocationOverrideConfig = useCallback((config: Partial<LocationOverride>) => {
    setLocationOverride(prev => ({
      ...prev,
      ...config,
    }))
  }, [])

  // Compute effective location as a memoized value
  const effectiveLocation = useMemo(() => {
    return getEffectiveLocation()
  }, [getEffectiveLocation])

  // Broadcast location to iframes and BroadcastChannel
  const broadcastLocationToIframes = useCallback(() => {
    if (!effectiveLocation) return

    const locationData = {
      type: "location-update",
      position: {
        latitude: effectiveLocation.coords.latitude,
        longitude: effectiveLocation.coords.longitude,
        accuracy: effectiveLocation.coords.accuracy,
        altitude: effectiveLocation.coords.altitude,
        altitudeAccuracy: effectiveLocation.coords.altitudeAccuracy,
        heading: effectiveLocation.coords.heading,
        speed: effectiveLocation.coords.speed,
      },
      timestamp: effectiveLocation.timestamp,
    }

    // Broadcast to all iframes
    const iframes = document.querySelectorAll("iframe")
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage(locationData, "*")
    })

    // Broadcast via BroadcastChannel
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(locationData)
    }
  }, [effectiveLocation])

  // Set time offset (public function)
  const setTimeOffset = useCallback((offset: number) => {
    setTimeOffsetState(offset)
    setCurrentTime(new Date(Date.now() + offset))
  }, [])

  // Persist SMS messages to localStorage whenever they change
  useEffect(() => {
    saveSMSToStorage(smsMessages)
  }, [smsMessages])

  // Persist email messages to localStorage whenever they change
  useEffect(() => {
    saveEmailToStorage(emailMessages)
  }, [emailMessages])

  // Persist WhatsApp messages to localStorage whenever they change
  useEffect(() => {
    saveWhatsAppToStorage(whatsappMessages)
  }, [whatsappMessages])

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date(Date.now() + timeOffset))
    }, 1000)

    return () => clearInterval(interval)
  }, [timeOffset])

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

  // Initialize BroadcastChannel for location updates
  useEffect(() => {
    if (typeof window === "undefined") return

    broadcastChannelRef.current = new BroadcastChannel("location-updates")

    return () => {
      broadcastChannelRef.current?.close()
    }
  }, [])

  // Route animation effect - runs every 100ms when route is playing
  useEffect(() => {
    if (
      !locationOverride.enabled ||
      locationOverride.mode !== "route" ||
      !locationOverride.route ||
      !locationOverride.route.isPlaying
    ) {
      return
    }

    const route = locationOverride.route
    const interval = setInterval(() => {
      const currentWaypoint = route.waypoints[route.currentWaypointIndex]
      const nextWaypointIndex = route.currentWaypointIndex + 1
      const nextWaypoint = route.waypoints[nextWaypointIndex]

      if (!currentWaypoint) return

      // If no next waypoint, handle loop or stop
      if (!nextWaypoint) {
        if (route.loop) {
          // Loop back to start
          setLocationOverrideConfig({
            route: {
              ...route,
              currentWaypointIndex: 0,
              progress: 0,
            },
          })
        } else {
          // Stop playing
          setLocationOverrideConfig({
            route: {
              ...route,
              isPlaying: false,
            },
          })
        }
        return
      }

      // Interpolate between current and next waypoint
      const newProgress = route.progress + 0.01 // 1% per 100ms

      if (newProgress >= 1.0) {
        // Move to next waypoint
        setLocationOverrideConfig({
          route: {
            ...route,
            currentWaypointIndex: nextWaypointIndex,
            progress: 0,
          },
        })
      } else {
        // Update progress
        const lat = currentWaypoint.latitude + (nextWaypoint.latitude - currentWaypoint.latitude) * newProgress
        const lon = currentWaypoint.longitude + (nextWaypoint.longitude - currentWaypoint.longitude) * newProgress

        // Calculate heading and speed
        const heading = calculateHeading(currentWaypoint, nextWaypoint)
        const speed = currentWaypoint.speed ?? nextWaypoint.speed ?? null

        setLocationOverrideConfig({
          route: {
            ...route,
            progress: newProgress,
          },
          staticPosition: {
            latitude: lat,
            longitude: lon,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading,
            speed,
          },
        })
      }

      // Broadcast the updated location
      broadcastLocationToIframes()
    }, 100)

    return () => clearInterval(interval)
  }, [locationOverride, setLocationOverrideConfig, broadcastLocationToIframes])

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
        emailMessages,
        addEmail,
        markEmailAsRead,
        deleteEmail,
        whatsappMessages,
        addWhatsApp,
        markWhatsAppAsRead,
        deleteWhatsAppConversation,
        location,
        effectiveLocation,
        requestLocation,
        watchLocation,
        clearLocationWatch,
        currentTime,
        timeOffset,
        setTimeOffset,
        locationOverride,
        setLocationOverrideConfig,
        broadcastLocationToIframes,
        phoneNumber,
        setPhoneNumber,
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
