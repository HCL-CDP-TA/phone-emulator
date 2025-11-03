"use client"

import { AppProps } from "@/types/app"

export default function ContactsApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-blue-500 font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Contacts</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-8">
        <div>
          <svg className="w-24 h-24 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z" />
          </svg>
          <p>No contacts</p>
        </div>
      </div>
    </div>
  )
}
