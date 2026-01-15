"use client"

import { useEffect, useRef } from "react"
import { usePhone } from "@/contexts/PhoneContext"

export function useEmailReceiver(phoneNumber: string | null) {
  const { addEmail } = usePhone()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!phoneNumber) {
      console.log("[Email SSE] No phone number, skipping SSE connection")
      return
    }

    let isMounted = true

    const connect = async () => {
      // Delay SSE connection to prevent connection exhaustion (stagger after SMS)
      await new Promise(resolve => setTimeout(resolve, 1500))
      if (!isMounted) return

      console.log("[Email SSE] Establishing connection for", phoneNumber)

      // Create SSE connection
      const eventSource = new EventSource(`/api/email/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)
      eventSourceRef.current = eventSource

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
      console.log("[Email SSE] Closing connection")
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [phoneNumber]) // Don't include addEmail - it's not stable and causes reconnections
}
