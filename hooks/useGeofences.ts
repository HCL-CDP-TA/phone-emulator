"use client"

import { useState, useEffect } from "react"

export interface Geofence {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number // meters
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

interface UseGeofencesReturn {
  geofences: Geofence[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useGeofences(): UseGeofencesReturn {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGeofences = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_GEOFENCE_API_URL || "http://localhost:3001"
      const apiKey = process.env.NEXT_PUBLIC_GEOFENCE_API_KEY

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`
      }

      const response = await fetch(`${baseUrl}/api/public/geofences`, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch geofences: ${response.statusText}`)
      }

      const data = await response.json()
      setGeofences(data.geofences || [])
    } catch (err) {
      console.error("Failed to load geofences:", err)
      setError(err instanceof Error ? err : new Error("Unknown error"))
      setGeofences([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGeofences()
  }, [])

  return {
    geofences,
    isLoading,
    error,
    refetch: fetchGeofences,
  }
}
