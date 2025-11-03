"use client"

import { AppProps } from "@/types/app"

export default function CameraApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-white">Camera</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center text-white text-center p-8">
        <div>
          <svg className="w-24 h-24 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15.2c-2.03 0-3.7-1.67-3.7-3.7s1.67-3.7 3.7-3.7 3.7 1.67 3.7 3.7-1.67 3.7-3.7 3.7zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z" />
          </svg>
          <p className="opacity-70">Camera functionality not available in demo</p>
        </div>
      </div>
    </div>
  )
}
