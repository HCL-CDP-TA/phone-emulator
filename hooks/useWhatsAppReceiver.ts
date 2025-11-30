"use client"

import { useEffect } from "react"
import { usePhone } from "@/contexts/PhoneContext"

export function useWhatsAppReceiver(phoneNumber: string | null) {
  const { addWhatsApp } = usePhone()

  useEffect(() => {
    if (!phoneNumber) {
      console.log("[WhatsApp SSE] No phone number, skipping SSE connection")
      return
    }

    console.log("[WhatsApp SSE] Establishing connection for", phoneNumber)

    // Create SSE connection
    const eventSource = new EventSource(`/api/whatsapp/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)

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
        console.log("[WhatsApp SSE] Received message:", { sender, hasButtons: !!buttons })

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

    // Cleanup on unmount
    return () => {
      console.log("[WhatsApp SSE] Closing connection")
      eventSource.close()
    }
  }, [phoneNumber, addWhatsApp])
}
