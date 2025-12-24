"use client"

import { LocationPreset } from "@/types/app"
import { Trash2, Edit2, X, MapPin, Route, Search, Loader2 } from "lucide-react"
import { useGeocoding } from "@/hooks/useGeocoding"
import { useState, useEffect } from "react"

type FormMode = "add" | "edit" | null

interface Waypoint {
  latitude: number
  longitude: number
  speed?: number
}

interface PresetPanelProps {
  presets: LocationPreset[]
  formMode: FormMode
  editingId: string | null
  name: string
  description: string
  type: "static" | "route"
  latitude: string
  longitude: string
  waypoints: Waypoint[]
  isClient: boolean
  isLoading?: boolean
  error?: string | null
  onOpenAddStaticForm: () => void
  onOpenAddRouteForm: () => void
  onOpenEditForm: (preset: LocationPreset) => void
  onDeletePreset: (id: string) => void
  onResetForm: () => void
  onSavePreset: () => void
  onSetName: (name: string) => void
  onSetDescription: (description: string) => void
  onSetType: (type: "static" | "route") => void
  onSetLatitude: (latitude: string) => void
  onSetLongitude: (longitude: string) => void
  onAddWaypoint: () => void
  onRemoveWaypoint: (index: number) => void
  onUpdateWaypoint: (index: number, field: keyof Waypoint, value: number | undefined) => void
  onGeocodeSelect: (lat: number, lon: number) => void
  onRetryFetch?: () => void
}

export default function PresetPanel({
  presets,
  formMode,
  editingId,
  name,
  description,
  type,
  latitude,
  longitude,
  waypoints,
  isClient,
  isLoading = false,
  error = null,
  onOpenAddStaticForm,
  onOpenAddRouteForm,
  onOpenEditForm,
  onDeletePreset,
  onResetForm,
  onSavePreset,
  onSetName,
  onSetDescription,
  onSetType,
  onSetLatitude,
  onSetLongitude,
  onAddWaypoint,
  onRemoveWaypoint,
  onUpdateWaypoint,
  onGeocodeSelect,
  onRetryFetch,
}: PresetPanelProps) {
  const { search, results, isSearching, clearResults } = useGeocoding()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (query.trim().length >= 3) {
      search(query)
    } else {
      clearResults()
    }
  }

  const handleResultClick = (lat: number, lon: number) => {
    onGeocodeSelect(lat, lon)
    setSearchQuery("")
    clearResults()
  }

  const formatPresetDisplay = (preset: LocationPreset): string => {
    if (preset.type === "static") {
      return `${preset.latitude?.toFixed(4)}, ${preset.longitude?.toFixed(4)}`
    } else if (preset.type === "route" && preset.waypoints) {
      return `${preset.waypoints.length} waypoints`
    }
    return "Invalid preset"
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="p-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Location Configuration</h1>
        <p className="text-sm text-gray-600 mb-4">Configure location presets for testing</p>

        {/* Search Box */}
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search locations (e.g., 'Sydney Opera House')"
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleResultClick(result.lat, result.lon)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0">
                  <div className="text-sm text-gray-800">{result.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Buttons */}
        {!formMode && (
          <div className="flex gap-2">
            <button
              onClick={onOpenAddStaticForm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
              <MapPin className="w-4 h-4" />
              Add Static Location
            </button>
            <button
              onClick={onOpenAddRouteForm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
              <Route className="w-4 h-4" />
              Add Route
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Add/Edit Form */}
        {formMode && (
          <div className="bg-white rounded-xl p-6 mb-6 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {formMode === "edit" ? "Edit Preset" : "Add New Preset"}
              </h2>
              <button
                onClick={onResetForm}
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
                  onChange={e => onSetName(e.target.value)}
                  placeholder="e.g., San Francisco Downtown"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => onSetDescription(e.target.value)}
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
                      onChange={e => onSetType(e.target.value as "static")}
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
                      onChange={e => onSetType(e.target.value as "route")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Route className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">Route</span>
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
                      onChange={e => onSetLatitude(e.target.value)}
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
                      onChange={e => onSetLongitude(e.target.value)}
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
                  </div>
                  <div className="space-y-3">
                    {waypoints.map((wp, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              value={wp.latitude}
                              onChange={e => onUpdateWaypoint(index, "latitude", parseFloat(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              value={wp.longitude}
                              onChange={e => onUpdateWaypoint(index, "longitude", parseFloat(e.target.value))}
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
                                onUpdateWaypoint(index, "speed", e.target.value ? parseFloat(e.target.value) : undefined)
                              }
                              placeholder="Optional"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveWaypoint(index)}
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
                  onClick={onSavePreset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                  {formMode === "edit" ? "Save Changes" : "Add Preset"}
                </button>
                <button
                  onClick={onResetForm}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Presets List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Configured Presets {isClient && !isLoading && `(${presets.length})`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
              <p className="text-gray-600">Loading presets...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              {onRetryFetch && (
                <button onClick={onRetryFetch} className="text-sm text-red-600 underline font-medium">
                  Retry
                </button>
              )}
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No presets yet</p>
              <p className="text-sm mt-1">Create your first location preset</p>
            </div>
          ) : (
            <div className="space-y-3">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
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
                      onClick={() => onOpenEditForm(preset)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit preset">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDeletePreset(preset.id)}
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
      </div>
    </div>
  )
}
