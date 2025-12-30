"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { GeofenceAppConfig, GEOFENCE_APPS } from "@/components/apps/geofenceAppsConfig"
import { GeofenceAppOverrides } from "@/types/app"

interface GeofenceAppsContextType {
  apps: GeofenceAppConfig[]
  addApp: (app: GeofenceAppConfig) => void
  updateApp: (id: string, updates: Partial<GeofenceAppConfig>) => void
  updateDefaultAppSettings: (appId: string, updates: Partial<GeofenceAppConfig>) => void
  deleteApp: (id: string) => void
  getApp: (id: string) => GeofenceAppConfig | undefined
  resetToDefaults: () => void
}

const GeofenceAppsContext = createContext<GeofenceAppsContextType | undefined>(undefined)

const STORAGE_KEY = "geofence-apps-config"
const OVERRIDES_STORAGE_KEY = "geofence-default-app-overrides"

export function GeofenceAppsProvider({ children }: { children: React.ReactNode }) {
  // Store only custom apps in state - default apps always come from GEOFENCE_APPS
  const [customApps, setCustomApps] = useState<GeofenceAppConfig[]>([])
  const [defaultAppOverrides, setDefaultAppOverrides] = useState<GeofenceAppOverrides>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Computed: merge default apps with overrides, then add custom apps
  const apps = React.useMemo(() => {
    const mergedDefaults = GEOFENCE_APPS.map(defaultApp => {
      const overrides = defaultAppOverrides[defaultApp.id]
      if (!overrides) {
        return defaultApp
      }

      // Deep merge notifications to preserve structure
      return {
        ...defaultApp,
        geotrackingEnabled: overrides.geotrackingEnabled ?? defaultApp.geotrackingEnabled,
        notifications: {
          enter: overrides.notifications?.enter ?? defaultApp.notifications.enter,
          exit: overrides.notifications?.exit ?? defaultApp.notifications.exit,
        },
        visible: true, // Always force visible for defaults
      }
    })
    return [...mergedDefaults, ...customApps]
  }, [customApps, defaultAppOverrides])

  // Load custom apps from localStorage and cleanup any default app IDs
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const defaultIds = GEOFENCE_APPS.map(app => app.id)

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GeofenceAppConfig[]
        // Remove any apps that have default IDs (cleanup migration)
        const cleanedCustomApps = parsed.filter(app => !defaultIds.includes(app.id))

        // Save cleaned version back if cleanup occurred
        if (cleanedCustomApps.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedCustomApps))
        }

        setCustomApps(cleanedCustomApps)
      } catch (error) {
        console.error("Failed to parse geofence apps from localStorage:", error)
        setCustomApps([])
      }
    }
    setIsInitialized(true)
  }, [])

  // Load default app overrides from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OVERRIDES_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GeofenceAppOverrides
        setDefaultAppOverrides(parsed)
      } catch (error) {
        console.error("Failed to parse default app overrides from localStorage:", error)
        setDefaultAppOverrides({})
      }
    }
  }, [])

  // Save custom apps to localStorage whenever they change (but skip initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customApps))
    }
  }, [customApps, isInitialized])

  const addApp = useCallback((app: GeofenceAppConfig) => {
    setCustomApps(prev => [...prev, app])
  }, [])

  const updateApp = useCallback((id: string, updates: Partial<GeofenceAppConfig>) => {
    const defaultIds = GEOFENCE_APPS.map(app => app.id)

    // If updating a custom app, update in customApps state
    if (!defaultIds.includes(id)) {
      setCustomApps(prev =>
        prev.map(app => {
          if (app.id === id) {
            return { ...app, ...updates }
          }
          return app
        }),
      )
    }
    // Note: Default apps cannot be updated (they always come from GEOFENCE_APPS)
  }, [])

  const deleteApp = useCallback((id: string) => {
    const defaultIds = GEOFENCE_APPS.map(app => app.id)

    // Prevent deletion of default apps (automatic check)
    if (defaultIds.includes(id)) {
      console.warn(`Cannot delete default app: ${id}`)
      return
    }

    setCustomApps(prev => prev.filter(app => app.id !== id))
  }, [])

  const updateDefaultAppSettings = useCallback((appId: string, updates: Partial<GeofenceAppConfig>) => {
    setDefaultAppOverrides(prev => {
      const existingOverride = prev[appId] || {}

      // Deep merge notifications
      const mergedNotifications = updates.notifications
        ? {
            enter: updates.notifications.enter ?? existingOverride.notifications?.enter,
            exit: updates.notifications.exit ?? existingOverride.notifications?.exit,
          }
        : existingOverride.notifications

      const newOverrides = {
        ...prev,
        [appId]: {
          ...existingOverride,
          geotrackingEnabled: updates.geotrackingEnabled ?? existingOverride.geotrackingEnabled,
          notifications: mergedNotifications,
        },
      }
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(newOverrides))
      return newOverrides
    })
  }, [])

  const getApp = useCallback(
    (id: string) => {
      return apps.find(app => app.id === id)
    },
    [apps],
  )

  const resetToDefaults = useCallback(() => {
    // Clear all custom apps - defaults will remain from GEOFENCE_APPS
    setCustomApps([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <GeofenceAppsContext.Provider
      value={{
        apps,
        addApp,
        updateApp,
        updateDefaultAppSettings,
        deleteApp,
        getApp,
        resetToDefaults,
      }}>
      {children}
    </GeofenceAppsContext.Provider>
  )
}

export function useGeofenceApps() {
  const context = useContext(GeofenceAppsContext)
  if (context === undefined) {
    throw new Error("useGeofenceApps must be used within a GeofenceAppsProvider")
  }
  return context
}
