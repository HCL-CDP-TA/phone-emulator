"use client"

import { useEffect } from "react"
import { usePhone } from "@/contexts/PhoneContext"

// Get or create a unique session ID for this browser tab/window
function getSessionId(): string {
  if (typeof window === "undefined") return ""

  // Try to get from sessionStorage (unique per tab)
  let sessionId = sessionStorage.getItem("phone-session-id")

  if (!sessionId) {
    // Generate a new session ID
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem("phone-session-id", sessionId)
  }

  return sessionId
}

export function useSMSReceiver() {
  const { addSMS } = usePhone()

  useEffect(() => {
    const sessionId = getSessionId()

    // Listen for SMS messages via BroadcastChannel (cross-tab communication)
    const channel = new BroadcastChannel("phone-sms-channel")

    channel.onmessage = event => {
      const { sender, message, targetSession } = event.data
      console.log("[BroadcastChannel] Received:", { sender, message, targetSession, mySession: sessionId })

      // Only process if message is for this session (or broadcast to all)
      if (targetSession === sessionId || targetSession === "*") {
        if (sender && message) {
          console.log("[BroadcastChannel] Processing SMS")
          addSMS({ sender, message })
        }
      } else {
        console.log("[BroadcastChannel] Ignoring - not for this session")
      }
    }

    // Also listen for same-window events (for backward compatibility)
    const handleSMSEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      const { sender, message } = customEvent.detail
      console.log("[CustomEvent] Received:", { sender, message })
      if (sender && message) {
        console.log("[CustomEvent] Processing SMS")
        addSMS({ sender, message })
      }
    }

    window.addEventListener("sms-received", handleSMSEvent)

    return () => {
      channel.close()
      window.removeEventListener("sms-received", handleSMSEvent)
    }
  }, [addSMS])

  return getSessionId()
}

// Global function to send SMS (can be called from tester page or API)
export function sendSMSToPhone(sender: string, message: string, targetSession?: string) {
  console.log("[sendSMSToPhone] Called with:", { sender, message, targetSession })

  // If no targetSession specified, use CustomEvent (same window - on-page tester)
  // If targetSession provided, use BroadcastChannel (different window - separate tab tester)
  if (!targetSession) {
    console.log("[sendSMSToPhone] No targetSession - using CustomEvent (same window)")
    const event = new CustomEvent("sms-received", {
      detail: { sender, message },
    })
    window.dispatchEvent(event)
  } else {
    // Targeting a different session - use BroadcastChannel only
    console.log("[sendSMSToPhone] Has targetSession - using BroadcastChannel (different window):", targetSession)
    const channel = new BroadcastChannel("phone-sms-channel")
    channel.postMessage({
      sender,
      message,
      targetSession: targetSession,
    })
    channel.close()
  }
}

// Make it available globally
if (typeof window !== "undefined") {
  ;(
    window as typeof window & { sendSMSToPhone: typeof sendSMSToPhone; getPhoneSessionId: typeof getSessionId }
  ).sendSMSToPhone = sendSMSToPhone
  ;(window as typeof window & { getPhoneSessionId: typeof getSessionId }).getPhoneSessionId = getSessionId
}
