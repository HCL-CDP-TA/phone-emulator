"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus } from "lucide-react"

interface TimePreset {
  id: string
  label: string
  description?: string
  type: "absolute" | "relative"
  absoluteDate?: string // ISO string
  relativeAmount?: number
  relativeUnit?: "minutes" | "hours" | "days" | "weeks"
}

export default function TimeConfigPage() {
  const [presets, setPresets] = useState<TimePreset[]>(() => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("phone-time-presets")
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error("Failed to load time presets:", error)
      }
    }
    return []
  })
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"absolute" | "relative">("absolute")
  const [absoluteDate, setAbsoluteDate] = useState("")
  const [relativeAmount, setRelativeAmount] = useState<number>(1)
  const [relativeUnit, setRelativeUnit] = useState<"minutes" | "hours" | "days" | "weeks">("days")
  const [isClient, setIsClient] = useState(false)

  // Mark as client-side mounted to avoid hydration mismatch
  useEffect(() => {
    Promise.resolve().then(() => setIsClient(true))
  }, [])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("phone-time-presets", JSON.stringify(presets))
    }
  }, [presets, isClient])

  const addPreset = () => {
    if (!label.trim()) {
      alert("Please enter a label")
      return
    }

    if (type === "absolute" && !absoluteDate) {
      alert("Please select a date and time")
      return
    }

    if (type === "relative" && (!relativeAmount || relativeAmount <= 0)) {
      alert("Please enter a valid amount")
      return
    }

    const newPreset: TimePreset = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      label: label.trim(),
      description: description.trim() || undefined,
      type,
      ...(type === "absolute" ? { absoluteDate } : { relativeAmount, relativeUnit }),
    }

    setPresets(prev => [...prev, newPreset])

    // Reset form
    setLabel("")
    setDescription("")
    setAbsoluteDate("")
    setRelativeAmount(1)
    setRelativeUnit("days")
  }

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id))
  }

  const formatPresetDisplay = (preset: TimePreset) => {
    if (preset.type === "absolute" && preset.absoluteDate) {
      const date = new Date(preset.absoluteDate)
      return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    } else if (preset.type === "relative") {
      return `+${preset.relativeAmount} ${preset.relativeUnit}`
    }
    return "Invalid preset"
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Time Travel Configuration</h1>
          <p className="text-gray-600 mb-8">
            Configure preset dates and times for demo purposes. These will appear in the time selector on the main phone
            screen.
          </p>

          {/* Add Preset Form */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Preset</h2>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g., 3 Days Later, Christmas Morning"
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
                      value="absolute"
                      checked={type === "absolute"}
                      onChange={e => setType(e.target.value as "absolute")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Absolute Date/Time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="relative"
                      checked={type === "relative"}
                      onChange={e => setType(e.target.value as "relative")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Relative Offset</span>
                  </label>
                </div>
              </div>

              {/* Absolute Date Input */}
              {type === "absolute" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={absoluteDate}
                    onChange={e => setAbsoluteDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Relative Input */}
              {type === "relative" && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={relativeAmount}
                      onChange={e => setRelativeAmount(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={relativeUnit}
                      onChange={e => setRelativeUnit(e.target.value as "minutes" | "hours" | "days" | "weeks")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={addPreset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-5 h-5" />
                Add Preset
              </button>
            </div>
          </div>

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
                        <h3 className="font-semibold text-gray-800">{preset.label}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            preset.type === "absolute" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                          }`}>
                          {preset.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{formatPresetDisplay(preset)}</p>
                      {preset.description && <p className="text-sm text-gray-500 italic">{preset.description}</p>}
                    </div>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete preset">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Configure your presets here (this can be done ahead of time)</li>
              <li>• On the main phone screen, look for the clock icon in the top-left corner</li>
              <li>• Click the clock to see your presets and select one to jump to that time</li>
              <li>• Time will continue ticking forward from the selected moment</li>
              <li>• Page refresh resets to real time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
