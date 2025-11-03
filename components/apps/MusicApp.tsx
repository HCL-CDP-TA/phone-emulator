"use client"

import { AppProps } from "@/types/app"

export default function MusicApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-linear-to-b from-pink-500 to-purple-600 text-white">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Music</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center text-center p-8 opacity-90">
        <div>
          <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <p>No music playing</p>
        </div>
      </div>
    </div>
  )
}
