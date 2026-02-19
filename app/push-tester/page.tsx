"use client"

import { useState, useEffect, Suspense } from "react"
import { appRegistry } from "@/lib/appRegistry"
import { SOCIAL_APPS } from "@/components/apps/socialAppsConfig"
import { SHORTCUT_APPS } from "@/components/apps/shortcutAppsConfig"
import { GEOFENCE_APPS } from "@/components/apps/geofenceAppsConfig"

const STORAGE_KEY = "phone-numbers-history"
const GEOFENCE_APPS_STORAGE_KEY = "geofence-apps-config"

interface ActionButton {
  id: string
  label: string
  url: string
}

interface AppOption {
  id: string
  name: string
  group: string
}

// Static apps (always available)
const staticApps: AppOption[] = [
  ...appRegistry.map(app => ({ id: app.id, name: app.name, group: "Built-in" })),
  ...SOCIAL_APPS.filter(s => !appRegistry.some(a => a.id === s.id)).map(app => ({ id: app.id, name: app.name, group: "Social" })),
  ...SHORTCUT_APPS.filter(s => !appRegistry.some(a => a.id === s.id)).map(app => ({ id: app.id, name: app.name, group: "Shortcuts" })),
  ...GEOFENCE_APPS.map(app => ({ id: app.id, name: app.name, group: "Settings Apps" })),
]

function TesterContent() {
  const [phoneNumber, setPhoneNumber] = useState("+12345678901")
  const [appId, setAppId] = useState("unibank")
  const [title, setTitle] = useState("Summer Sale!")
  const [body, setBody] = useState("Get 50% off all items this weekend only.")
  const [imageUrl, setImageUrl] = useState("")
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([
    { id: "shop", label: "Shop Now", url: "https://example.com/sale" },
  ])
  const [status, setStatus] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [savedNumbers, setSavedNumbers] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [allApps, setAllApps] = useState<AppOption[]>(staticApps)

  // Load from localStorage after mount
  useEffect(() => {
    Promise.resolve().then(() => {
      const storedPhoneNumber = localStorage.getItem("phone-number")

      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          setSavedNumbers(JSON.parse(saved))
        }
      } catch (error) {
        console.error("Failed to load saved phone numbers:", error)
      }

      // Load custom geofence apps from localStorage (same key as GeofenceAppsContext)
      try {
        const storedGeofenceApps = localStorage.getItem(GEOFENCE_APPS_STORAGE_KEY)
        if (storedGeofenceApps) {
          const customApps = JSON.parse(storedGeofenceApps) as Array<{ id: string; name: string; visible: boolean }>
          const visibleCustomApps = customApps
            .filter(app => app.visible)
            .filter(app => !staticApps.some(s => s.id === app.id))
            .map(app => ({ id: app.id, name: app.name, group: "Settings Apps (Custom)" }))
          if (visibleCustomApps.length > 0) {
            setAllApps(prev => [...prev, ...visibleCustomApps])
          }
        }
      } catch (error) {
        console.error("Failed to load custom geofence apps:", error)
      }

      if (storedPhoneNumber && storedPhoneNumber !== "skip") {
        setPhoneNumber(storedPhoneNumber)
      }

      setIsLoaded(true)
    })
  }, [])

  // Save phone number to localStorage when it changes
  useEffect(() => {
    if (phoneNumber && isLoaded) {
      localStorage.setItem("phone-number", phoneNumber)

      if (!savedNumbers.includes(phoneNumber)) {
        const updated = [...savedNumbers, phoneNumber]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        setSavedNumbers(updated)
      }
    }
  }, [phoneNumber, isLoaded, savedNumbers])

  const removePhoneNumber = (numberToRemove: string) => {
    try {
      const updated = savedNumbers.filter(n => n !== numberToRemove)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSavedNumbers(updated)
    } catch (error) {
      console.error("Failed to remove phone number:", error)
    }
  }

  const handleSelectNumber = (number: string) => {
    setPhoneNumber(number)
    setShowDropdown(false)
  }

  const addActionButton = () => {
    if (actionButtons.length >= 3) return
    setActionButtons([...actionButtons, { id: `btn${Date.now()}`, label: "", url: "" }])
  }

  const updateActionButton = (index: number, field: keyof ActionButton, value: string) => {
    const updated = [...actionButtons]
    updated[index] = { ...updated[index], [field]: value }
    setActionButtons(updated)
  }

  const removeActionButton = (index: number) => {
    setActionButtons(actionButtons.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const requestBody: Record<string, unknown> = {
        phoneNumber,
        appId,
        title,
        body,
      }
      if (imageUrl) requestBody.imageUrl = imageUrl
      if (actionButtons.length > 0) {
        requestBody.actionButtons = actionButtons.filter(b => b.label)
      }

      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("Sent successfully!")
      } else {
        setStatus(`Failed: ${data.error || data.message}`)
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }

    setTimeout(() => setStatus(""), 3000)
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Push Notification Tester</h1>
            <p className="text-gray-600">Send test push notifications to any app on the phone emulator</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Recipient)</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  onFocus={() => savedNumbers.length > 0 && setShowDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  placeholder="+12345678901"
                />
                {showDropdown && savedNumbers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                      Previously Used Numbers
                    </div>
                    {savedNumbers.map(number => (
                      <div
                        key={number}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group">
                        <button onClick={() => handleSelectNumber(number)} className="flex-1 text-left font-mono">
                          {number}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            removePhoneNumber(number)
                          }}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* App Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target App</label>
              <select
                value={appId}
                onChange={e => setAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white">
                {allApps.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Notification title"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Notification body text..."
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://example.com/banner.jpg"
              />
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-20 rounded-lg border border-gray-200 object-cover"
                    onError={e => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Action Buttons <span className="text-gray-400">(max 3)</span>
                </label>
                {actionButtons.length < 3 && (
                  <button
                    onClick={addActionButton}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                    <span className="text-lg">+</span> Add Button
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {actionButtons.map((btn, index) => (
                  <div key={btn.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={btn.label}
                        onChange={e => updateActionButton(index, "label", e.target.value)}
                        placeholder="Button label"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button onClick={() => removeActionButton(index)} className="text-red-500 hover:text-red-700 px-2">
                        ✕
                      </button>
                    </div>
                    <input
                      type="url"
                      value={btn.url}
                      onChange={e => updateActionButton(index, "url", e.target.value)}
                      placeholder="URL to open (empty = just dismiss)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
                {actionButtons.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No action buttons. Click "Add Button" to create interactive buttons.
                  </p>
                )}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !title || !body || !phoneNumber || !appId}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Push Notification"
              )}
            </button>

            {/* Status Message */}
            {status && (
              <div
                className={`p-3 rounded-lg text-center font-medium ${
                  status.startsWith("Sent") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                {status}
              </div>
            )}
          </div>

          {/* API Documentation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">API Documentation</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Endpoint:</p>
                <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                  POST /api/push
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Example Request:</p>
                <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto">
                  {`curl -X POST http://localhost:3000/api/push \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "${phoneNumber}",
    "appId": "${appId}",
    "title": "${title}",
    "body": "${body}"${imageUrl ? `,
    "imageUrl": "${imageUrl}"` : ""}${actionButtons.length > 0 ? `,
    "actionButtons": ${JSON.stringify(actionButtons.filter(b => b.label), null, 6).split("\n").join("\n    ")}` : ""}
  }'`}
                </pre>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Phone number must match the logged-in phone on the emulator</li>
              <li>The notification banner shows the target app's icon and color</li>
              <li>Action button URLs open in the phone's browser app</li>
              <li>Empty URL on an action button will just dismiss the notification</li>
              <li>Images display as a banner in the notification (h-32, object-cover)</li>
              <li>Maximum 3 action buttons per notification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PushTester() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TesterContent />
    </Suspense>
  )
}
