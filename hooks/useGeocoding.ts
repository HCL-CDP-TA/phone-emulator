"use client"

import { useState, useCallback, useMemo } from "react"
import { debounce } from "@/lib/debounce"

export interface GeocodingResult {
  lat: number
  lon: number
  display_name: string
  importance?: number
}

interface UseGeocodingReturn {
  search: (query: string) => void
  results: GeocodingResult[]
  isSearching: boolean
  error: Error | null
  clearResults: () => void
}

export function useGeocoding(): UseGeocodingReturn {
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const performSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      const response = await fetch(url, {
        headers: {
          "User-Agent": "PhoneEmulator/1.0",
        },
      })

      if (!response.ok) {
        throw new Error("Geocoding request failed")
      }

      const data = await response.json()
      const parsedResults: GeocodingResult[] = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        importance: item.importance,
      }))

      setResults(parsedResults)
    } catch (err) {
      console.error("Geocoding error:", err)
      setError(err instanceof Error ? err : new Error("Unknown error"))
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Create debounced search function (500ms delay)
  const debouncedSearch = useMemo(() => debounce(performSearch, 500), [])

  const search = useCallback(
    (query: string) => {
      debouncedSearch(query)
    },
    [debouncedSearch]
  )

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  return {
    search,
    results,
    isSearching,
    error,
    clearResults,
  }
}
