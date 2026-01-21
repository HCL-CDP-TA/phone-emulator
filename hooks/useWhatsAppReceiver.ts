"use client"

import { useEffect, useRef } from "react"
import { usePhone } from "@/contexts/PhoneContext"

export function useWhatsAppReceiver(phoneNumber: string | null) {
  const { addWhatsApp } = usePhone()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!phoneNumber) {
      console.log("[WhatsApp SSE] No phone number, skipping SSE connection")
      return
    }

    let isMounted = true

    const connect = async () => {
      // Delay SSE connection to prevent connection exhaustion (stagger after Email)
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (!isMounted) return

      console.log("[WhatsApp SSE] Establishing connection for", phoneNumber)

      // Create SSE connection
      const eventSource = new EventSource(`/api/whatsapp/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          // Check if it's a connection message
          if (data.type === "connected") {
            console.log("[WhatsApp SSE] Connected for", data.phoneNumber)
            return
          }

          // It's a WhatsApp message
          const { sender, message, senderNumber, profilePictureUrl, buttons } = data
          console.log("[WhatsApp SSE] Received message:", {
            sender,
            hasButtons: !!buttons,
            eventData: JSON.parse(event.data),
          })

          if (sender && message) {
            addWhatsApp({
              sender,
              message,
              senderNumber,
              profilePictureUrl,
              buttons,
            })
          }
        } catch (error) {
          console.error("[WhatsApp SSE] Error parsing message:", error)
        }
      }

      eventSource.onerror = error => {
        console.error("[WhatsApp SSE] Connection error:", error)
        eventSource.close()
      }
    }

    // Close on page unload to prevent connection exhaustion
    const handleBeforeUnload = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    connect()

    // Cleanup on unmount
    return () => {
      isMounted = false
      console.log("[WhatsApp SSE] Closing connection")
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [phoneNumber]) // Don't include addWhatsApp - it's not stable and causes reconnections
}
