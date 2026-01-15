"use client"

import { useState, useEffect } from "react"
import { LocationPreset } from "@/types/app"
import { useGeofences } from "@/hooks/useGeofences"
import dynamic from "next/dynamic"
import PresetPanel from "@/components/location-config/PresetPanel"
import RouteBuilder from "@/components/location-config/RouteBuilder"
import { Plus } from "lucide-react"

// Dynamically import map component to avoid SSR issues
const LocationConfigMap = dynamic(() => import("@/components/location-config/LocationConfigMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
})

type FormMode = "add" | "edit" | null
type ViewMode = "idle" | "creating-static" | "creating-route"

interface Waypoint {
  latitude: number
  longitude: number
  speed?: number
}

export default function LocationConfigPage() {
  const [presets, setPresets] = useState<LocationPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>("idle")
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"static" | "route">("static")
  const [latitude, setLatitude] = useState<string>("")
  const [longitude, setLongitude] = useState<string>("")
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0, speed: 10 },
  ])
  const [isClient, setIsClient] = useState(false)
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [routeWaypoints, setRouteWaypoints] = useState<Array<{ lat: number; lng: number }>>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]) // Default SF
  const [mapZoom, setMapZoom] = useState<number>(12)
  const [toast, setToast] = useState<string | null>(null)
  const [hasSetInitialLocation, setHasSetInitialLocation] = useState(false)

  const { geofences, isLoading: geofencesLoading } = useGeofences()

  // Mark as client-side mounted to avoid hydration mismatch
  useEffect(() => {
    Promise.resolve().then(() => setIsClient(true))
  }, [])

  // Get user's current location on mount to center the map
  useEffect(() => {
    if (!hasSetInitialLocation && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setMapCenter([position.coords.latitude, position.coords.longitude])
          setMapZoom(13)
          setHasSetInitialLocation(true)
        },
        error => {
          // If location fails, just keep the default San Francisco location
          console.log("Could not get initial location, using default:", error.message)
          setHasSetInitialLocation(true)
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      )
    }
  }, [hasSetInitialLocation])

  // Fetch presets from API on mount
  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/location-presets")
      if (!response.ok) throw new Error("Failed to fetch presets")
      const data = await response.json()
      setPresets(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch presets")
    } finally {
      setIsLoading(false)
    }
  }

  // ESC key handler to cancel operations
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewMode !== "idle") {
        if (routeWaypoints.length > 0 || tempLocation) {
          if (confirm("Cancel current operation?")) {
            cancelCreation()
          }
        } else {
          cancelCreation()
        }
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [viewMode, routeWaypoints, tempLocation])

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const resetForm = () => {
    setFormMode(null)
    setEditingId(null)
    setName("")
    setDescription("")
    setType("static")
    setLatitude("")
    setLongitude("")
    setWaypoints([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0, speed: 10 },
    ])
    // Also clear map markers when canceling
    cancelCreation()
  }

  const cancelCreation = () => {
    setViewMode("idle")
    setTempLocation(null)
    setRouteWaypoints([])
  }

  const openAddStaticForm = () => {
    resetForm()
    setViewMode("creating-static")
    showToast("Click on map to set location")
  }

  const openAddRouteForm = () => {
    resetForm()
    setType("route")
    setViewMode("creating-route")
    setRouteWaypoints([])
    showToast("Click on map to add waypoints (minimum 2)")
  }

  const openEditForm = (preset: LocationPreset) => {
    setFormMode("edit")
    setEditingId(preset.id)
    setName(preset.name)
    setDescription(preset.description || "")
    setType(preset.type)

    if (preset.type === "static") {
      setLatitude(preset.latitude?.toString() || "")
      setLongitude(preset.longitude?.toString() || "")
      // Show marker on map and allow clicking to update location
      setTempLocation({ lat: preset.latitude!, lng: preset.longitude! })
      setViewMode("creating-static")
      showToast("Click on map to update location")
      // Center map on the location
      setMapCenter([preset.latitude!, preset.longitude!])
      setMapZoom(15)
    } else if (preset.type === "route" && preset.waypoints) {
      setWaypoints(preset.waypoints)
      // Show route on map and allow adding more waypoints
      setRouteWaypoints(preset.waypoints.map(wp => ({ lat: wp.latitude, lng: wp.longitude })))
      setViewMode("creating-route")
      showToast("Click on map to add waypoints, or edit values below")
      // Center map on first waypoint
      if (preset.waypoints.length > 0) {
        setMapCenter([preset.waypoints[0].latitude, preset.waypoints[0].longitude])
        setMapZoom(13)
      }
    }
  }

  const validateForm = (): boolean => {
    if (!name.trim()) {
      alert("Please enter a name")
      return false
    }

    if (type === "static") {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        alert("Latitude must be between -90 and 90")
        return false
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        alert("Longitude must be between -180 and 180")
        return false
      }
    } else if (type === "route") {
      if (waypoints.length < 2) {
        alert("Route must have at least 2 waypoints")
        return false
      }
      for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i]
        if (isNaN(wp.latitude) || wp.latitude < -90 || wp.latitude > 90) {
          alert(`Waypoint ${i + 1}: Latitude must be between -90 and 90`)
          return false
        }
        if (isNaN(wp.longitude) || wp.longitude < -180 || wp.longitude > 180) {
          alert(`Waypoint ${i + 1}: Longitude must be between -180 and 180`)
          return false
        }
        if (wp.speed !== undefined && (isNaN(wp.speed) || wp.speed < 0)) {
          alert(`Waypoint ${i + 1}: Speed must be a positive number`)
          return false
        }
      }
    }

    return true
  }

  const savePreset = async () => {
    if (!validateForm()) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      ...(type === "static" ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) } : { waypoints }),
    }

    try {
      const url = formMode === "edit" ? `/api/location-presets/${editingId}` : "/api/location-presets"
      const method = formMode === "edit" ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save preset")
      const { data } = await response.json()

      // Optimistic update
      if (formMode === "edit") {
        setPresets(prev => prev.map(p => (p.id === editingId ? data : p)))
        showToast("Preset updated successfully")
      } else {
        setPresets(prev => [...prev, data])
        showToast("Preset added successfully")
      }

      resetForm()
      cancelCreation()
    } catch (err) {
      showToast(`Error: ${err instanceof Error ? err.message : "Failed to save"}`)
    }
  }

  const deletePreset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) return

    try {
      const response = await fetch(`/api/location-presets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      setPresets(prev => prev.filter(p => p.id !== id))
      showToast("Preset deleted")
    } catch (err) {
      showToast(`Error: ${err instanceof Error ? err.message : "Failed to delete"}`)
      // Reload on error
      fetchPresets()
    }
  }

  const addWaypoint = () => {
    setWaypoints(prev => [...prev, { latitude: 0, longitude: 0, speed: 10 }])
  }

  const removeWaypoint = (index: number) => {
    if (waypoints.length <= 2) {
      alert("Route must have at least 2 waypoints")
      return
    }
    setWaypoints(prev => prev.filter((_, i) => i !== index))
  }

  const updateWaypoint = (index: number, field: keyof Waypoint, value: number | undefined) => {
    setWaypoints(prev => prev.map((wp, i) => (i === index ? { ...wp, [field]: value } : wp)))
  }

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    if (viewMode === "creating-static") {
      setTempLocation(latlng)
      setLatitude(latlng.lat.toString())
      setLongitude(latlng.lng.toString())

      // If not already editing, set to add mode and exit creation
      if (formMode !== "edit") {
        setFormMode("add")
        setViewMode("idle")
        showToast("Location set! Fill in the details and save")
      } else {
        // If editing, keep in edit mode and creation mode for further adjustments
        showToast("Location updated! Click save or adjust again")
      }
    } else if (viewMode === "creating-route") {
      setRouteWaypoints(prev => [...prev, latlng])
    }
  }

  const handleUndoLastWaypoint = () => {
    setRouteWaypoints(prev => prev.slice(0, -1))
  }

  const handleFinishRoute = () => {
    if (routeWaypoints.length < 2) {
      alert("Route must have at least 2 waypoints")
      return
    }

    // Convert routeWaypoints to waypoints format
    const convertedWaypoints: Waypoint[] = routeWaypoints.map((wp, index) => ({
      latitude: wp.lat,
      longitude: wp.lng,
      speed: waypoints[index]?.speed ?? 10, // Preserve existing speed or default to 10
    }))

    setWaypoints(convertedWaypoints)

    // If already editing, keep edit mode, otherwise switch to add
    if (formMode !== "edit") {
      setFormMode("add")
    }
    setViewMode("idle")
    showToast("Route updated! Fill in the details and save")
  }

  const handleGeocodeSelect = (lat: number, lon: number) => {
    setMapCenter([lat, lon])
    setMapZoom(15)
    showToast("Map moved to location")
  }

  const handleMyLocation = (lat: number, lng: number) => {
    setMapCenter([lat, lng])
    setMapZoom(16)
    showToast("Centered on your location")
  }

  const handleWaypointDrag = (index: number, latlng: { lat: number; lng: number }) => {
    // Update the visual waypoints on the map
    setRouteWaypoints(prev => prev.map((wp, i) => (i === index ? latlng : wp)))

    // Update the form waypoints data
    setWaypoints(prev =>
      prev.map((wp, i) => (i === index ? { ...wp, latitude: latlng.lat, longitude: latlng.lng } : wp)),
    )
  }

  const handleStaticLocationDrag = (latlng: { lat: number; lng: number }) => {
    // Update the visual marker on the map
    setTempLocation(latlng)

    // Update the form latitude and longitude fields
    setLatitude(latlng.lat.toString())
    setLongitude(latlng.lng.toString())
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Map Container - 60% */}
      <div className="w-[60%] relative">
        <LocationConfigMap
          geofences={geofences}
          presets={presets}
          viewMode={viewMode}
          tempLocation={tempLocation}
          routeWaypoints={routeWaypoints}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          onMapClick={handleMapClick}
          onMyLocation={handleMyLocation}
          onWaypointDrag={handleWaypointDrag}
          onStaticLocationDrag={handleStaticLocationDrag}
        />

        {/* Route Builder Controls */}
        {viewMode === "creating-route" && (
          <RouteBuilder
            waypoints={routeWaypoints}
            onUndoLastWaypoint={handleUndoLastWaypoint}
            onFinishRoute={handleFinishRoute}
            onAddWaypoint={() => showToast("Click on map to add waypoint")}
          />
        )}
      </div>

      {/* Preset Panel - 40% */}
      <div className="w-[40%]">
        <PresetPanel
          presets={presets}
          formMode={formMode}
          editingId={editingId}
          name={name}
          description={description}
          type={type}
          latitude={latitude}
          longitude={longitude}
          waypoints={waypoints}
          isClient={isClient}
          isLoading={isLoading}
          error={error}
          onOpenAddStaticForm={openAddStaticForm}
          onOpenAddRouteForm={openAddRouteForm}
          onOpenEditForm={openEditForm}
          onDeletePreset={deletePreset}
          onResetForm={resetForm}
          onSavePreset={savePreset}
          onSetName={setName}
          onSetDescription={setDescription}
          onSetType={setType}
          onSetLatitude={setLatitude}
          onSetLongitude={setLongitude}
          onAddWaypoint={addWaypoint}
          onRemoveWaypoint={removeWaypoint}
          onUpdateWaypoint={updateWaypoint}
          onGeocodeSelect={handleGeocodeSelect}
          onRetryFetch={fetchPresets}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl z-[2000] animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
