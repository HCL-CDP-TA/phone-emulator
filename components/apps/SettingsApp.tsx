"use client"

import { AppProps } from "@/types/app"

export default function SettingsApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-blue-500 font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          <div className="p-4 flex items-center justify-between">
            <span>Airplane Mode</span>
            <div className="w-12 h-6 bg-gray-300 rounded-full" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <span>Wi-Fi</span>
            <span className="text-gray-500">Connected</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span>Bluetooth</span>
            <span className="text-gray-500">On</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span>Notifications</span>
            <span className="text-gray-500">→</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span>Display & Brightness</span>
            <span className="text-gray-500">→</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span>Sound & Haptics</span>
            <span className="text-gray-500">→</span>
          </div>
        </div>
      </div>
    </div>
  )
}
