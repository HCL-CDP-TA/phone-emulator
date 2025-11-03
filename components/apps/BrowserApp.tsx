"use client"

import { AppProps } from "@/types/app"
import { useState, useRef } from "react"

export default function BrowserApp({ onClose }: AppProps) {
  const [url, setUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("browserUrl") || ""
    }
    return ""
  })
  const [currentUrl, setCurrentUrl] = useState(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("browserUrl")
      if (savedUrl) {
        localStorage.removeItem("browserUrl")
      }
      return savedUrl || ""
    }
    return ""
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let processedUrl = url.trim()

    // Add https:// if no protocol specified
    if (processedUrl && !processedUrl.match(/^https?:\/\//)) {
      processedUrl = "https://" + processedUrl
    }

    setCurrentUrl(processedUrl)
  }

  const handleRefresh = () => {
    setCurrentUrl(prev => prev + "?t=" + Date.now())
  }

  const handleBack = () => {
    // Browser back functionality would require iframe postMessage communication
    // For now, just close the browser
    onClose()
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Address Bar with Navigation */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-gray-100 border-b">
        <button
          type="button"
          onClick={handleBack}
          className="text-blue-500 hover:text-blue-600 p-1"
          title="Back to home">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button type="button" onClick={handleRefresh} className="text-blue-500 hover:text-blue-600 p-1" title="Refresh">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-full px-4 py-2">
          <svg className="w-4 h-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter URL"
            className="flex-1 outline-none text-sm"
          />
        </div>
      </form>

      {/* Browser Content */}
      <div className="flex-1 relative bg-white pb-12">
        {currentUrl ? (
          <iframe
            key={currentUrl}
            src={currentUrl}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser content"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <p>Enter a URL to browse</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
