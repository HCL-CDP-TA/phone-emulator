"use client"

import { AppProps } from "@/types/app"

export default function MapsApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <button onClick={onClose} className="text-blue-500 font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Maps</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-8">
        <div>
          <svg className="w-24 h-24 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
          </svg>
          <p>Maps functionality not available in demo</p>
        </div>
      </div>
    </div>
  )
}
