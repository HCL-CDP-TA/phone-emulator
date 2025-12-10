"use client"

import { useEffect } from "react"
import { usePhone } from "@/contexts/PhoneContext"

export function useEmailReceiver(phoneNumber: string | null) {
  const { addEmail } = usePhone()

  useEffect(() => {
    if (!phoneNumber) {
      console.log("[Email SSE] No phone number, skipping SSE connection")
      return
    }

    console.log("[Email SSE] Establishing connection for", phoneNumber)

    // Create SSE connection
    const eventSource = new EventSource(`/api/email/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        // Check if it's a connection message
        if (data.type === "connected") {
          console.log("[Email SSE] Connected for", data.phoneNumber)
          return
        }

        // It's an email message
        const { from, fromName, to, subject, htmlContent, textContent } = data
        console.log("[Email SSE] Received email:", { from, fromName, subject })

        if (from && subject) {
          addEmail({
            from,
            fromName,
            to: to || phoneNumber,
            subject,
            htmlContent,
            textContent: textContent || subject,
          })
        }
      } catch (error) {
        console.error("[Email SSE] Error parsing message:", error)
      }
    }

    eventSource.onerror = error => {
      console.error("[Email SSE] Connection error:", error)
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      console.log("[Email SSE] Closing connection")
      eventSource.close()
    }
  }, [phoneNumber]) // Don't include addEmail - it's not stable and causes reconnections
}
