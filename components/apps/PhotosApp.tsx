"use client"

import { AppProps } from "@/types/app"

export default function PhotosApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-blue-500 font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Photos</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-8">
        <div>
          <svg className="w-24 h-24 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <p>No photos</p>
        </div>
      </div>
    </div>
  )
}
