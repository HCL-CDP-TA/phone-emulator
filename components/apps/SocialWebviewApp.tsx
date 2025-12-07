"use client"
import React, { useEffect, useRef, useState } from "react"
import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"

interface SocialWebviewAppProps extends AppProps {
  url: string
  appName: string
  icon: React.ReactNode
}

export default function SocialWebviewApp({ url, appName }: SocialWebviewAppProps) {
  const [inAppUrl, setInAppUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { location } = usePhone()

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only accept messages of the correct type
      if (event.data && event.data.type === "open-url" && typeof event.data.url === "string") {
        setInAppUrl(event.data.url)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Forward location updates to iframe
  useEffect(() => {
    if (location.position && iframeRef.current) {
      const contentWindow = iframeRef.current.contentWindow
      if (contentWindow) {
        contentWindow.postMessage(
          {
            type: "location-update",
            position: location.position,
          },
          "*"
        )
      }
    }
  }, [location.position])

  return (
    <div className="flex flex-col h-full bg-white relative">
      <iframe
        ref={iframeRef}
        src={url}
        title={appName}
        className="flex-1 w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      {/* In-app browser popup overlay */}
      {inAppUrl && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="relative w-[95%] h-[90%] bg-white rounded-xl shadow-xl flex flex-col">
            {/* Popup header */}
            <div className="flex items-center justify-between p-2 border-b bg-gray-100 rounded-t-xl">
              <span className="font-medium text-gray-700 truncate max-w-[80%]">{inAppUrl}</span>
              <button
                aria-label="Close in-app browser"
                className="ml-2 px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium focus:outline-none"
                onClick={() => setInAppUrl(null)}>
                Close
              </button>
            </div>
            <iframe
              id="in-app-browser-iframe"
              src={inAppUrl}
              title="In-app browser"
              className="flex-1 w-full h-full border-0 rounded-b-xl"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}
    </div>
  )
}
