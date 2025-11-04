"use client"

import { useEffect, useRef } from "react"
import { usePhone } from "@/contexts/PhoneContext"

interface UseLocationOptions {
  watch?: boolean // If true, continuously watch position
  requestOnMount?: boolean // If true, request location when component mounts
}

/**
 * Hook for accessing device location in phone emulator apps
 *
 * @param options Configuration options
 * @returns Location state and control functions
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const { position, error, isLoading, requestLocation } = useLocation({
 *     requestOnMount: true
 *   })
 *
 *   if (isLoading) return <div>Getting location...</div>
 *   if (error) return <div>Location error: {error.message}</div>
 *   if (!position) return <button onClick={requestLocation}>Get Location</button>
 *
 *   return (
 *     <div>
 *       Lat: {position.coords.latitude}
 *       Lng: {position.coords.longitude}
 *     </div>
 *   )
 * }
 * ```
 */
export function useLocation(options: UseLocationOptions = {}) {
  const { watch = false, requestOnMount = false } = options
  const { location, requestLocation, watchLocation, clearLocationWatch } = usePhone()
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Request location on mount if requested
    if (requestOnMount && !location.position && !location.isLoading) {
      requestLocation()
    }
  }, [requestOnMount, requestLocation, location.position, location.isLoading])

  useEffect(() => {
    // Start watching location if requested
    if (watch && !watchIdRef.current) {
      const watchId = watchLocation()
      if (watchId !== null) {
        watchIdRef.current = watchId
      }
    }

    // Cleanup: stop watching when component unmounts or watch is disabled
    return () => {
      if (watchIdRef.current !== null) {
        clearLocationWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [watch, watchLocation, clearLocationWatch])

  return {
    position: location.position,
    error: location.error,
    isLoading: location.isLoading,
    hasPermission: location.hasPermission,
    requestLocation,
  }
}
