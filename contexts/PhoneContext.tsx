"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"
import { Notification, SMS } from "@/types/app"

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
}

const PhoneContext = createContext<PhoneContextType | undefined>(undefined)

// Load SMS from localStorage
function loadSMSFromStorage(): SMS[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("phone-sms-messages")
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return parsed.map((sms: SMS) => ({
        ...sms,
        timestamp: new Date(sms.timestamp),
      }))
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

  const openApp = useCallback((appId: string) => {
    setActiveApp(appId)
  }, [])

  const closeApp = useCallback(() => {
    setActiveApp(null)
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
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
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      }
      setSmsMessages(prev => [newSMS, ...prev])

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

  // Persist SMS messages to localStorage whenever they change
  useEffect(() => {
    saveSMSToStorage(smsMessages)
  }, [smsMessages])

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
