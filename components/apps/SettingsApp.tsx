"use client"

import { AppProps } from "@/types/app"
import { useGeofenceApps } from "@/contexts/GeofenceAppsContext"
import { GeofenceAppConfig, GEOFENCE_APPS } from "@/components/apps/geofenceAppsConfig"
import { geofenceIconPresets, iconPresetNames } from "@/components/apps/geofenceIconPresets"
import { useState } from "react"

// Icon selector component with visual preview
const IconSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-2">
    <label className="block text-xs font-medium text-gray-700">Icon</label>
    <div className="grid grid-cols-4 gap-2">
      {iconPresetNames.map(iconName => {
        const icon = geofenceIconPresets[iconName]
        const isSelected = value === iconName
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`p-3 rounded-lg border-2 transition-all ${
              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}>
            <div className="flex items-center justify-center text-gray-700">{icon}</div>
            <div className="text-xs mt-1 text-gray-600 truncate">{iconName}</div>
          </button>
        )
      })}
    </div>
  </div>
)

// Color selector component with visual swatches
const ColorSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const colorOptions = [
    { value: "bg-blue-500", label: "Blue", hex: "#3b82f6" },
    { value: "bg-blue-700", label: "Dark Blue", hex: "#1d4ed8" },
    { value: "bg-red-500", label: "Red", hex: "#ef4444" },
    { value: "bg-red-600", label: "Dark Red", hex: "#dc2626" },
    { value: "bg-green-500", label: "Green", hex: "#22c55e" },
    { value: "bg-green-700", label: "Dark Green", hex: "#15803d" },
    { value: "bg-purple-500", label: "Purple", hex: "#a855f7" },
    { value: "bg-purple-700", label: "Dark Purple", hex: "#7e22ce" },
    { value: "bg-orange-500", label: "Orange", hex: "#f97316" },
    { value: "bg-yellow-500", label: "Yellow", hex: "#eab308" },
    { value: "bg-pink-500", label: "Pink", hex: "#ec4899" },
    { value: "bg-gray-500", label: "Gray", hex: "#6b7280" },
    { value: "bg-gray-700", label: "Dark Gray", hex: "#374151" },
  ]

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700">Color</label>
      <div className="grid grid-cols-5 gap-2">
        {colorOptions.map(color => {
          const isSelected = value === color.value
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <div className={`w-8 h-8 rounded-full ${color.value}`} />
              <div className="text-xs mt-1 text-gray-600 text-center">{color.label}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// User ID mode selector with descriptions
const UserIdModeSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-2">
    <label className="block text-xs font-medium text-gray-700">User ID Source</label>
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onChange("manual")}
        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
          value === "manual" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}>
        <div className="flex items-start gap-2">
          <div
            className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
              value === "manual" ? "border-blue-500" : "border-gray-300"
            }`}>
            {value === "manual" && <div className="w-3 h-3 bg-blue-500 rounded-full m-0.5" />}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Manual Entry</div>
            <div className="text-xs text-gray-600 mt-0.5">
              User enters their ID via a button in the app (best for brand websites). Choose this if unsure.
            </div>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onChange("postmessage")}
        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
          value === "postmessage" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}>
        <div className="flex items-start gap-2">
          <div
            className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
              value === "postmessage" ? "border-blue-500" : "border-gray-300"
            }`}>
            {value === "postmessage" && <div className="w-3 h-3 bg-blue-500 rounded-full m-0.5" />}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">PostMessage (from website)</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Website sends user ID automatically when they log in (requires integration)
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
)

// Form component for add/edit
const AppForm = ({
  isEditing,
  formData,
  setFormData,
  onSave,
  onCancel,
}: {
  isEditing: boolean
  formData: Partial<GeofenceAppConfig>
  setFormData: (data: Partial<GeofenceAppConfig>) => void
  onSave: () => void
  onCancel: () => void
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">App Name</label>
      <input
        type="text"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Starbucks"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Website URL</label>
      <input
        type="url"
        value={formData.url}
        onChange={e => setFormData({ ...formData, url: e.target.value })}
        placeholder="https://example.com"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <IconSelector
      value={formData.iconName || "Store"}
      onChange={value => setFormData({ ...formData, iconName: value })}
    />

    <ColorSelector
      value={formData.iconColor || "bg-blue-500"}
      onChange={value => setFormData({ ...formData, iconColor: value })}
    />

    <UserIdModeSelector
      value={formData.userIdMode || "manual"}
      onChange={value => setFormData({ ...formData, userIdMode: value as "postmessage" | "manual" })}
    />

    <div className="space-y-2 pt-2 border-t">
      <label className="block text-xs font-medium text-gray-700">Notifications</label>
      <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
        <input
          type="checkbox"
          checked={formData.notifications?.enter.enabled}
          onChange={e =>
            setFormData({
              ...formData,
              notifications: {
                ...formData.notifications!,
                enter: { enabled: e.target.checked },
              },
            })
          }
          className="w-4 h-4 text-blue-500 rounded"
        />
        <span className="text-sm">Notify on geofence entry</span>
      </label>
      <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
        <input
          type="checkbox"
          checked={formData.notifications?.exit.enabled}
          onChange={e =>
            setFormData({
              ...formData,
              notifications: {
                ...formData.notifications!,
                exit: { enabled: e.target.checked },
              },
            })
          }
          className="w-4 h-4 text-blue-500 rounded"
        />
        <span className="text-sm">Notify on geofence exit</span>
      </label>
    </div>

    <div className="flex gap-2 pt-2">
      <button
        onClick={onSave}
        className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors">
        {isEditing ? "Save Changes" : "Add App"}
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
        Cancel
      </button>
    </div>
  </div>
)

export default function SettingsApp({ onClose }: AppProps) {
  const { apps, addApp, updateApp, updateDefaultAppSettings, deleteApp, resetToDefaults } = useGeofenceApps()
  const [editingApp, setEditingApp] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState<Partial<GeofenceAppConfig>>({
    name: "",
    url: "",
    iconName: "Store",
    iconColor: "bg-blue-500",
    userIdMode: "manual",
    notifications: {
      enter: { enabled: true },
      exit: { enabled: true },
    },
    geotrackingEnabled: true,
    visible: true,
  })

  const startEdit = (app: GeofenceAppConfig) => {
    setFormData(app)
    setEditingApp(app.id)
  }

  const startAdd = () => {
    setFormData({
      name: "",
      url: "",
      iconName: "Store",
      iconColor: "bg-blue-500",
      userIdMode: "manual",
      notifications: {
        enter: { enabled: true },
        exit: { enabled: true },
      },
      geotrackingEnabled: true,
      visible: true,
    })
    setShowAddModal(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      alert("Name and URL are required")
      return
    }

    if (editingApp) {
      // Update existing
      updateApp(editingApp, formData)
      setEditingApp(null)
    } else {
      // Add new
      const newApp: GeofenceAppConfig = {
        id: `geofence-${Date.now()}`,
        name: formData.name!,
        url: formData.url!,
        iconName: formData.iconName || "Store",
        iconColor: formData.iconColor || "bg-blue-500",
        userIdMode: formData.userIdMode || "manual",
        notifications: formData.notifications || {
          enter: { enabled: true },
          exit: { enabled: true },
        },
        geotrackingEnabled: formData.geotrackingEnabled !== false,
        visible: formData.visible !== false,
      }
      addApp(newApp)
      setShowAddModal(false)
    }
  }

  const handleCancel = () => {
    setEditingApp(null)
    setShowAddModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this app?")) {
      deleteApp(id)
    }
  }

  const handleToggleMonitoring = (appId: string) => {
    const app = apps.find(a => a.id === appId)
    if (!app) return

    const isDefault = GEOFENCE_APPS.some(defaultApp => defaultApp.id === appId)
    const newEnabled = !app.geotrackingEnabled

    if (isDefault) {
      updateDefaultAppSettings(appId, { geotrackingEnabled: newEnabled })
    } else {
      updateApp(appId, { geotrackingEnabled: newEnabled })
    }
  }

  const handleToggleNotifyEnter = (appId: string) => {
    const app = apps.find(a => a.id === appId)
    if (!app) return

    const isDefault = GEOFENCE_APPS.some(defaultApp => defaultApp.id === appId)
    const newEnabled = !app.notifications.enter.enabled

    if (isDefault) {
      updateDefaultAppSettings(appId, {
        notifications: {
          ...app.notifications,
          enter: { enabled: newEnabled },
        },
      })
    } else {
      updateApp(appId, {
        notifications: {
          ...app.notifications,
          enter: { enabled: newEnabled },
        },
      })
    }
  }

  const handleToggleNotifyExit = (appId: string) => {
    const app = apps.find(a => a.id === appId)
    if (!app) return

    const isDefault = GEOFENCE_APPS.some(defaultApp => defaultApp.id === appId)
    const newEnabled = !app.notifications.exit.enabled

    if (isDefault) {
      updateDefaultAppSettings(appId, {
        notifications: {
          ...app.notifications,
          exit: { enabled: newEnabled },
        },
      })
    } else {
      updateApp(appId, {
        notifications: {
          ...app.notifications,
          exit: { enabled: newEnabled },
        },
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <button onClick={onClose} className="text-blue-500 hover:text-blue-600 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Manage Apps</h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* App List */}
        <div className="divide-y divide-gray-200">
          {apps.map(app => (
            <div key={app.id} className="p-4 bg-white">
              {editingApp === app.id ? (
                // Edit Form
                <AppForm
                  isEditing={true}
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                // Display Mode
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 ${app.iconColor} rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        {geofenceIconPresets[app.iconName as keyof typeof geofenceIconPresets] ||
                          geofenceIconPresets.Store}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{app.name}</div>
                        <div className="text-xs text-gray-500 truncate">{app.url}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {app.userIdMode === "manual" ? "Manual ID" : "Auto ID"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(app)}
                        className="text-blue-500 text-sm font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        Edit
                      </button>
                      {/* Only allow deletion of custom apps (not default apps) */}
                      {!GEOFENCE_APPS.some(defaultApp => defaultApp.id === app.id) && (
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-red-500 text-sm font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visible toggle - only show for custom apps (default apps are always visible) */}
                  {!GEOFENCE_APPS.some(defaultApp => defaultApp.id === app.id) && (
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Visible on home screen</span>
                      </div>
                      <button
                        onClick={() => updateApp(app.id, { visible: !app.visible })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          app.visible ? "bg-green-500" : "bg-gray-300"
                        }`}>
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            app.visible ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Geofence monitoring</span>
                    </div>
                    <button
                      onClick={() => handleToggleMonitoring(app.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        app.geotrackingEnabled ? "bg-green-500" : "bg-gray-300"
                      }`}>
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          app.geotrackingEnabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Notify on enter</span>
                    </div>
                    <button
                      onClick={() => handleToggleNotifyEnter(app.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        app.notifications.enter.enabled ? "bg-blue-500" : "bg-gray-300"
                      }`}>
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          app.notifications.enter.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Notify on exit</span>
                    </div>
                    <button
                      onClick={() => handleToggleNotifyExit(app.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        app.notifications.exit.enabled ? "bg-blue-500" : "bg-gray-300"
                      }`}>
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          app.notifications.exit.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New App Section */}
        {showAddModal ? (
          <div className="p-4 bg-white border-t-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add New App</h3>
            <AppForm
              isEditing={false}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="p-4">
            <button
              onClick={startAdd}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New App
            </button>
          </div>
        )}

        {/* Reset Button */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={() => {
              if (confirm("Reset all apps to defaults? This will delete all custom apps.")) {
                resetToDefaults()
              }
            }}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
