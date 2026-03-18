"use client"

import { useEffect, useRef } from "react"
import { usePhone } from "@/contexts/PhoneContext"
import { getAppById } from "@/lib/appRegistry"
import { SOCIAL_APPS } from "@/components/apps/socialAppsConfig"
import { socialIcons } from "@/components/apps/socialIcons"
import { GEOFENCE_APPS } from "@/components/apps/geofenceAppsConfig"
import { geofenceIconPresets } from "@/components/apps/geofenceIconPresets"
import { geofenceAppIcons } from "@/components/apps/geofenceAppIcons"

/**
 * Single SSE connection that handles SMS, email, WhatsApp, and push events.
 * Replaces the 4 separate SSE hooks to stay within the browser's HTTP/1.1
 * per-origin connection limit (6 total).
 */
export function useUnifiedReceiver(phoneNumber: string | null) {
  const { addSMS, addEmail, addWhatsApp, addNotification, openApp } = usePhone()
  const eventSourceRef = useRef<EventSource | null>(null)

  // Keep fresh refs so the long-lived SSE handler always calls the latest
  // versions of these callbacks (which change every second due to currentTime)
  const addSMSRef = useRef(addSMS)
  const addEmailRef = useRef(addEmail)
  const addWhatsAppRef = useRef(addWhatsApp)
  const addNotificationRef = useRef(addNotification)
  const openAppRef = useRef(openApp)
  useEffect(() => {
    addSMSRef.current = addSMS
    addEmailRef.current = addEmail
    addWhatsAppRef.current = addWhatsApp
    addNotificationRef.current = addNotification
    openAppRef.current = openApp
  })

  useEffect(() => {
    if (!phoneNumber) return

    let isMounted = true

    const connect = async () => {
      // Small delay to let the page finish initial rendering
      await new Promise(resolve => setTimeout(resolve, 500))
      if (!isMounted) return

      console.log("[Unified SSE] Establishing connection for", phoneNumber)

      const eventSource = new EventSource(
        `/api/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`,
      )
      eventSourceRef.current = eventSource

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            console.log("[Unified SSE] Connected for", data.phoneNumber)
            return
          }

          if (data.type === "sms") {
            const { sender, message, avatarInitials, avatarUrl } = data
            if (sender && message) {
              console.log("[Unified SSE] SMS from", sender)
              addSMSRef.current({ sender, message, avatarInitials, avatarUrl })
            }
            return
          }

          if (data.type === "email") {
            const { from, fromName, to, subject, htmlContent, textContent, avatarInitials, avatarUrl } = data
            if (from && subject) {
              console.log("[Unified SSE] Email from", from)
              addEmailRef.current({
                from,
                fromName,
                to: to || phoneNumber,
                subject,
                htmlContent,
                textContent: textContent || subject,
                avatarInitials,
                avatarUrl,
              })
            }
            return
          }

          if (data.type === "whatsapp") {
            const { sender, message, senderNumber, profilePictureUrl, avatarInitials, buttons } = data
            if (sender && message) {
              console.log("[Unified SSE] WhatsApp from", sender)
              addWhatsAppRef.current({ sender, message, senderNumber, profilePictureUrl, avatarInitials, buttons })
            }
            return
          }

          if (data.type === "push") {
            const { appId, title, body, imageUrl, actionButtons } = data
            if (!appId || !title || !body) return

            // Resolve app icon/color from multiple sources
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let icon: any = undefined
            let iconColor: string | undefined = undefined
            let appName = appId

            const registryApp = getAppById(appId)
            if (registryApp) {
              icon = registryApp.icon
              iconColor = registryApp.iconColor
              appName = registryApp.name
            } else {
              const socialApp = SOCIAL_APPS.find(a => a.id === appId)
              if (socialApp) {
                icon = socialIcons[socialApp.iconName as keyof typeof socialIcons]
                iconColor = socialApp.iconColor
                appName = socialApp.name
              } else {
                const geofenceApp = GEOFENCE_APPS.find(a => a.id === appId)
                if (geofenceApp) {
                  icon =
                    geofenceIconPresets[geofenceApp.iconName as keyof typeof geofenceIconPresets] ||
                    geofenceAppIcons[geofenceApp.iconName as keyof typeof geofenceAppIcons] ||
                    geofenceIconPresets.Store
                  iconColor = geofenceApp.iconColor
                  appName = geofenceApp.name
                } else {
                  try {
                    const stored = localStorage.getItem("geofence-apps-config")
                    if (stored) {
                      const customApps = JSON.parse(stored) as Array<{
                        id: string; name: string; iconName: string; iconColor: string; visible: boolean
                      }>
                      const customApp = customApps.find(a => a.id === appId && a.visible)
                      if (customApp) {
                        icon =
                          geofenceIconPresets[customApp.iconName as keyof typeof geofenceIconPresets] ||
                          geofenceAppIcons[customApp.iconName as keyof typeof geofenceAppIcons] ||
                          geofenceIconPresets.Store
                        iconColor = customApp.iconColor
                        appName = customApp.name
                      }
                    }
                  } catch { /* ignore */ }
                }
              }
            }

            console.log("[Unified SSE] Push notification for app", appId)
            addNotificationRef.current({
              appId,
              appName,
              title,
              message: body,
              icon,
              iconColor,
              imageUrl,
              actionButtons,
              onClick: () => openAppRef.current(appId),
            })
          }
        } catch (error) {
          console.error("[Unified SSE] Error parsing message:", error)
        }
      }

      eventSource.onerror = () => {
        console.error("[Unified SSE] Connection error")
        eventSource.close()
      }
    }

    const handleBeforeUnload = () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    connect()

    return () => {
      isMounted = false
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (eventSourceRef.current) {
        console.log("[Unified SSE] Closing connection")
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [phoneNumber]) // eslint-disable-line react-hooks/exhaustive-deps
}
