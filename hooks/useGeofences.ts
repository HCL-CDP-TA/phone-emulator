"use client"

import { useState, useEffect } from "react"

export interface Coordinate {
  lat: number
  lng: number
}

export interface Geofence {
  id: string
  name: string
  coordinates: Coordinate[] // Polygon vertices
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

// Singleton cache to prevent duplicate requests across multiple hook instances
interface CacheEntry {
  geofences: Geofence[]
  error: Error | null
  timestamp: number
  promise: Promise<void> | null
}

let cache: CacheEntry = {
  geofences: [],
  error: null,
  timestamp: 0,
  promise: null,
}

const CACHE_DURATION = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

// Listeners for cache updates
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(listener => listener())
}

let retryCount = 0
let isRetrying = false

async function fetchGeofencesShared(): Promise<void> {
  // If already fetching, return the existing promise
  if (cache.promise) {
    return cache.promise
  }

  // If we have fresh cached data, don't fetch again
  const now = Date.now()
  if (cache.timestamp && now - cache.timestamp < CACHE_DURATION && !cache.error) {
    return Promise.resolve()
  }

  // If we've exceeded max retries and are in error state, don't retry unless explicitly requested
  if (cache.error && retryCount >= MAX_RETRIES && !isRetrying) {
    console.warn(`[Geofences] Max retries (${MAX_RETRIES}) exceeded. Call refetch() to try again.`)
    return Promise.resolve()
  }

  const fetchPromise = (async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_GEOFENCE_API_URL
      const apiKey = process.env.NEXT_PUBLIC_GEOFENCE_API_KEY

      // If no API URL is configured, skip fetching
      if (!baseUrl) {
        console.log("[Geofences] No NEXT_PUBLIC_GEOFENCE_API_URL configured, skipping geofence fetch")
        cache = {
          geofences: [],
          error: null,
          timestamp: Date.now(),
          promise: null,
        }
        notifyListeners()
        return
      }

      console.log(`[Geofences] Fetching from: ${baseUrl}/api/public/geofences`)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`
      }

      const response = await fetch(`${baseUrl}/api/public/geofences`, {
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Success - reset retry count and update cache
      retryCount = 0
      cache = {
        geofences: data.geofences || [],
        error: null,
        timestamp: Date.now(),
        promise: null,
      }

      console.log(`[Geofences] Successfully loaded ${cache.geofences.length} geofences`)
      notifyListeners()
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      console.error(`[Geofences] Fetch failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message)

      retryCount++

      cache = {
        geofences: [],
        error,
        timestamp: Date.now(),
        promise: null,
      }

      notifyListeners()

      // If we haven't hit max retries, schedule a retry
      if (retryCount < MAX_RETRIES) {
        console.log(`[Geofences] Retrying in ${RETRY_DELAY / 1000}s...`)
        setTimeout(() => {
          fetchGeofencesShared()
        }, RETRY_DELAY)
      } else {
        console.error(`[Geofences] Max retries reached. No more automatic retries. Call refetch() to try again.`)
      }
    }
  })()

  cache.promise = fetchPromise
  await fetchPromise
  cache.promise = null
}

export function useGeofences(): UseGeofencesReturn {
  const [state, setState] = useState(() => ({
    geofences: cache.geofences,
    error: cache.error,
    isLoading: !cache.timestamp,
  }))

  useEffect(() => {
    // Subscribe to cache updates
    const listener = () => {
      setState({
        geofences: cache.geofences,
        error: cache.error,
        isLoading: false,
      })
    }
    listeners.add(listener)

    // Initial fetch if needed (listener will update state when done)
    if (!cache.timestamp) {
      fetchGeofencesShared()
    }

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const refetch = () => {
    console.log("[Geofences] Manual refetch requested - resetting retry count")
    retryCount = 0 // Reset retry count on manual refetch
    isRetrying = true
    setState(prev => ({ ...prev, isLoading: true }))
    cache.timestamp = 0 // Invalidate cache
    fetchGeofencesShared().finally(() => {
      isRetrying = false
      setState({
        geofences: cache.geofences,
        error: cache.error,
        isLoading: false,
      })
    })
  }

  return {
    geofences: state.geofences,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  }
}
