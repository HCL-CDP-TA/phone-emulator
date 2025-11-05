"use client"

import { AppProps } from "@/types/app"
import { useLocation } from "@/hooks/useLocation"

export default function MapsApp({ onClose }: AppProps) {
  // Location is automatically requested when phone loads, no need for requestOnMount
  const { position, error, isLoading, hasPermission, requestLocation } = useLocation()

  // Generate OpenStreetMap embed URL when position is available
  const mapUrl = position
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${position.coords.longitude - 0.01},${
        position.coords.latitude - 0.01
      },${position.coords.longitude + 0.01},${position.coords.latitude + 0.01}&layer=mapnik&marker=${
        position.coords.latitude
      },${position.coords.longitude}`
    : ""

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <button onClick={onClose} className="text-blue-500 hover:text-blue-600 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Maps</h1>
        <button onClick={requestLocation} className="text-blue-500 font-medium" disabled={isLoading}>
          {isLoading ? "..." : "📍"}
        </button>
      </div>

      {/* Map Display */}
      {position && mapUrl ? (
        <div className="flex-1 relative">
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            title="Map"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Location Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <div className="text-sm font-semibold mb-2">Current Location</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">Latitude:</span>
                <div className="font-mono">{position.coords.latitude.toFixed(6)}</div>
              </div>
              <div>
                <span className="font-medium">Longitude:</span>
                <div className="font-mono">{position.coords.longitude.toFixed(6)}</div>
              </div>
              {position.coords.accuracy && (
                <div className="col-span-2">
                  <span className="font-medium">Accuracy:</span> ±{Math.round(position.coords.accuracy)}m
                </div>
              )}
              {position.coords.altitude !== null && (
                <div>
                  <span className="font-medium">Altitude:</span> {Math.round(position.coords.altitude)}m
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Getting your location...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <svg className="w-24 h-24 mx-auto mb-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              <path d="M12 11.5L12 11.5z" fill="white" />
            </svg>
            <p className="text-red-600 font-semibold mb-2">Location Error</p>
            <p className="text-gray-600 text-sm mb-4">
              {error.code === 1
                ? "Location access denied. Please enable location permissions in your browser."
                : error.code === 2
                ? "Location unavailable. Please check your device settings."
                : error.code === 3
                ? "Location request timed out. Please try again."
                : error.message}
            </p>
            {hasPermission === false && (
              <div className="text-xs text-gray-500 bg-gray-100 rounded p-3 mb-4">
                <p className="font-semibold mb-1">How to enable location:</p>
                <p className="text-left">
                  1. Click the location icon in your browser&apos;s address bar
                  <br />
                  2. Select &quot;Allow&quot; for location access
                  <br />
                  3. Refresh this page
                </p>
              </div>
            )}
            <button
              onClick={requestLocation}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <p className="text-gray-600 mb-4">Enable location to see your position on the map</p>
            <button
              onClick={requestLocation}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Enable Location
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
