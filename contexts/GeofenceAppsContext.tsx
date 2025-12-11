"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { GeofenceAppConfig, GEOFENCE_APPS } from "@/components/apps/geofenceAppsConfig"

interface GeofenceAppsContextType {
  apps: GeofenceAppConfig[]
  addApp: (app: GeofenceAppConfig) => void
  updateApp: (id: string, updates: Partial<GeofenceAppConfig>) => void
  deleteApp: (id: string) => void
  getApp: (id: string) => GeofenceAppConfig | undefined
  resetToDefaults: () => void
}

const GeofenceAppsContext = createContext<GeofenceAppsContextType | undefined>(undefined)

const STORAGE_KEY = "geofence-apps-config"

export function GeofenceAppsProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<GeofenceAppConfig[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load apps from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setApps(parsed)
      } catch (error) {
        console.error("Failed to parse geofence apps from localStorage:", error)
        setApps(GEOFENCE_APPS)
      }
    } else {
      // First time - use defaults
      setApps(GEOFENCE_APPS)
    }
    setIsInitialized(true)
  }, [])

  // Save apps to localStorage whenever they change (but skip initial load)
  useEffect(() => {
    if (isInitialized && apps.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
    }
  }, [apps, isInitialized])

  const addApp = useCallback((app: GeofenceAppConfig) => {
    setApps(prev => [...prev, app])
  }, [])

  const updateApp = useCallback((id: string, updates: Partial<GeofenceAppConfig>) => {
    setApps(prev =>
      prev.map(app => {
        if (app.id === id) {
          return { ...app, ...updates }
        }
        return app
      }),
    )
  }, [])

  const deleteApp = useCallback((id: string) => {
    // Prevent deletion of default apps
    if (id === "banking" || id === "telco" || id === "costco") {
      console.warn(`Cannot delete default app: ${id}`)
      return
    }
    setApps(prev => prev.filter(app => app.id !== id))
  }, [])

  const getApp = useCallback(
    (id: string) => {
      return apps.find(app => app.id === id)
    },
    [apps],
  )

  const resetToDefaults = useCallback(() => {
    setApps(GEOFENCE_APPS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(GEOFENCE_APPS))
  }, [])

  return (
    <GeofenceAppsContext.Provider
      value={{
        apps,
        addApp,
        updateApp,
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
