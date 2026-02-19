"use client"

import { useEffect, useRef } from "react"
import { usePhone } from "@/contexts/PhoneContext"
import { getAppById } from "@/lib/appRegistry"
import { SOCIAL_APPS } from "@/components/apps/socialAppsConfig"
import { socialIcons } from "@/components/apps/socialIcons"
import { GEOFENCE_APPS } from "@/components/apps/geofenceAppsConfig"
import { geofenceIconPresets } from "@/components/apps/geofenceIconPresets"
import { geofenceAppIcons } from "@/components/apps/geofenceAppIcons"

export function usePushReceiver(phoneNumber: string | null) {
  const { addNotification, openApp } = usePhone()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!phoneNumber) {
      return
    }

    let isMounted = true

    const connect = async () => {
      // Stagger delay after WhatsApp's 2000ms
      await new Promise(resolve => setTimeout(resolve, 2500))
      if (!isMounted) return

      console.log("[Push SSE] Establishing connection for", phoneNumber)

      const eventSource = new EventSource(`/api/push/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            console.log("[Push SSE] Connected for", data.phoneNumber)
            return
          }

          const { appId, title, body, imageUrl, actionButtons } = data

          if (!appId || !title || !body) return

          // Resolve app icon/color from multiple sources
          let icon: React.ReactNode = undefined
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
                // Check custom geofence apps from localStorage
                try {
                  const stored = localStorage.getItem("geofence-apps-config")
                  if (stored) {
                    const customApps = JSON.parse(stored) as Array<{ id: string; name: string; iconName: string; iconColor: string; visible: boolean }>
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
                } catch {
                  // Ignore localStorage errors
                }
              }
            }
          }

          console.log("[Push SSE] Received push notification:", { appId, title })

          addNotification({
            appId,
            appName,
            title,
            message: body,
            icon,
            iconColor,
            imageUrl,
            actionButtons,
            onClick: () => openApp(appId),
          })
        } catch (error) {
          console.error("[Push SSE] Error parsing message:", error)
        }
      }

      eventSource.onerror = error => {
        console.error("[Push SSE] Connection error:", error)
        eventSource.close()
      }
    }

    const handleBeforeUnload = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    connect()

    return () => {
      isMounted = false
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [phoneNumber]) // eslint-disable-line react-hooks/exhaustive-deps
}
