"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { X } from "lucide-react"
import { useState } from "react"

export default function LocationPermissionBanner() {
  const { location, requestLocation } = usePhone()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if already have permission, still loading, or user dismissed
  if (dismissed || location.hasPermission === true || location.isLoading) {
    return null
  }

  // Show if permission denied or unknown/not requested
  const isBlocked = location.hasPermission === false
  const needsPermission = location.hasPermission === null && location.error !== null

  if (!isBlocked && !needsPermission) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-3 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-yellow-600 hover:text-yellow-800"
        aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <svg
          className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">
            {isBlocked ? "Location Access Blocked" : "Location Access Needed"}
          </h3>

          {isBlocked ? (
            <div className="text-xs text-yellow-800 space-y-2">
              <p>Location permissions were denied. To enable location features:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click the lock/info icon in your browser's address bar</li>
                <li>Change location permission to "Allow"</li>
                <li>Reload the page</li>
              </ol>
            </div>
          ) : (
            <div className="text-xs text-yellow-800 space-y-2">
              <p>This app uses your location for demos. Click below to grant access.</p>
              <button
                onClick={() => requestLocation()}
                className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                Enable Location Access
              </button>
            </div>
          )}

          {!isBlocked && (
            <p className="text-xs text-yellow-700 mt-2 italic">
              Note: Location requires HTTPS in production. If you're on HTTP, location will not work.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
