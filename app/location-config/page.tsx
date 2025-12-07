"use client"

import { useState, useEffect } from "react"
import { LocationPreset } from "@/types/app"
import { DEFAULT_LOCATION_PRESETS } from "@/lib/locationPresets"
import { Trash2, Plus, Edit2, X, MapPin, Route } from "lucide-react"

type FormMode = "add" | "edit" | null

interface Waypoint {
  latitude: number
  longitude: number
  speed?: number
}

export default function LocationConfigPage() {
  const [presets, setPresets] = useState<LocationPreset[]>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCATION_PRESETS
    const stored = localStorage.getItem("locationPresets")
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error("Failed to load location presets:", error)
      }
    }
    return DEFAULT_LOCATION_PRESETS
  })

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

  // Mark as client-side mounted to avoid hydration mismatch
  useEffect(() => {
    Promise.resolve().then(() => setIsClient(true))
  }, [])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("locationPresets", JSON.stringify(presets))
    }
  }, [presets, isClient])

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
  }

  const openAddForm = () => {
    resetForm()
    setFormMode("add")
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
    } else if (preset.type === "route" && preset.waypoints) {
      setWaypoints(preset.waypoints)
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

  const savePreset = () => {
    if (!validateForm()) return

    const newPreset: LocationPreset = {
      id: editingId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      ...(type === "static"
        ? {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          }
        : {
            waypoints: waypoints.map(wp => ({
              latitude: wp.latitude,
              longitude: wp.longitude,
              speed: wp.speed,
            })),
          }),
    }

    if (formMode === "edit" && editingId) {
      setPresets(prev => prev.map(p => (p.id === editingId ? newPreset : p)))
    } else {
      setPresets(prev => [...prev, newPreset])
    }

    resetForm()
  }

  const deletePreset = (id: string) => {
    if (confirm("Are you sure you want to delete this preset?")) {
      setPresets(prev => prev.filter(p => p.id !== id))
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

  const formatPresetDisplay = (preset: LocationPreset): string => {
    if (preset.type === "static") {
      return `${preset.latitude?.toFixed(4)}, ${preset.longitude?.toFixed(4)}`
    } else if (preset.type === "route" && preset.waypoints) {
      return `${preset.waypoints.length} waypoints`
    }
    return "Invalid preset"
  }

  const resetToDefaults = () => {
    if (confirm("Reset all presets to defaults? This will overwrite your current configuration.")) {
      setPresets(DEFAULT_LOCATION_PRESETS)
      resetForm()
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">Location Preset Configuration</h1>
            <button
              onClick={resetToDefaults}
              className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors">
              Reset to Defaults
            </button>
          </div>
          <p className="text-gray-600 mb-8">
            Configure location presets for testing geolocation features. Create static locations or routes with multiple
            waypoints.
          </p>

          {/* Add/Edit Form */}
          {formMode && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {formMode === "edit" ? "Edit Preset" : "Add New Preset"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Cancel">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., San Francisco Downtown"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional context for this preset"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="static"
                        checked={type === "static"}
                        onChange={e => setType(e.target.value as "static")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Static Location</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="route"
                        checked={type === "route"}
                        onChange={e => setType(e.target.value as "route")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Route className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Route (Multiple Waypoints)</span>
                    </label>
                  </div>
                </div>

                {/* Static Location Fields */}
                {type === "static" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={e => setLatitude(e.target.value)}
                        placeholder="e.g., 37.7749"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={e => setLongitude(e.target.value)}
                        placeholder="e.g., -122.4194"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
                    </div>
                  </div>
                )}

                {/* Route Waypoints */}
                {type === "route" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Waypoints <span className="text-red-500">*</span> (min. 2)
                      </label>
                      <button
                        onClick={addWaypoint}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        Add Waypoint
                      </button>
                    </div>
                    <div className="space-y-3">
                      {waypoints.map((wp, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                              <input
                                type="number"
                                step="any"
                                value={wp.latitude}
                                onChange={e => updateWaypoint(index, "latitude", parseFloat(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                              <input
                                type="number"
                                step="any"
                                value={wp.longitude}
                                onChange={e => updateWaypoint(index, "longitude", parseFloat(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Speed (m/s)</label>
                              <input
                                type="number"
                                step="any"
                                value={wp.speed ?? ""}
                                onChange={e =>
                                  updateWaypoint(index, "speed", e.target.value ? parseFloat(e.target.value) : undefined)
                                }
                                placeholder="Optional"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeWaypoint(index)}
                            disabled={waypoints.length <= 2}
                            className="mt-5 p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove waypoint">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={savePreset}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                    {formMode === "edit" ? "Save Changes" : "Add Preset"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Button (when form is closed) */}
          {!formMode && (
            <button
              onClick={openAddForm}
              className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-5 h-5" />
              Add New Preset
            </button>
          )}

          {/* Presets List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Configured Presets {isClient && `(${presets.length})`}
            </h2>

            {!isClient ? (
              <div className="text-center py-12 text-gray-500">
                <p>Loading...</p>
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No presets configured yet.</p>
                <p className="text-sm mt-1">Add your first preset above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {preset.type === "static" ? (
                          <MapPin className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Route className="w-4 h-4 text-green-600" />
                        )}
                        <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            preset.type === "static" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                          }`}>
                          {preset.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{formatPresetDisplay(preset)}</p>
                      {preset.description && <p className="text-sm text-gray-500 italic">{preset.description}</p>}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditForm(preset)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit preset">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete preset">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Configure location presets here for testing location-based features</li>
              <li>• Static locations provide a fixed GPS coordinate</li>
              <li>• Routes define a path with multiple waypoints and optional speeds</li>
              <li>• Use these presets in the Maps app or other location-aware apps</li>
              <li>• Changes are saved automatically to browser localStorage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
