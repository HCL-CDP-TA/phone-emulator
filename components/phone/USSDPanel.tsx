"use client"

import { useState, useEffect } from "react"
import { usePhone } from "@/contexts/PhoneContext"
import { USSDConfig } from "@/types/ussd"

export default function USSDPanel() {
  const { openApp } = usePhone()
  const [config, setConfig] = useState<USSDConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ussd/config")
      .then(res => res.json())
      .then(data => {
        if (data.success) setConfig(data.data)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  function handleDial(code: string) {
    openApp("dialer")
    window.dispatchEvent(new CustomEvent("ussd-dial", { detail: { code } }))
  }

  return (
    <div className="w-[280px] h-[875px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-4">
        <div className="text-white font-semibold text-lg">
          {config?.networkName ?? "USSD Services"}
        </div>
        <div className="text-teal-100 text-xs mt-0.5">Tap a service to dial</div>
      </div>

      {/* Code list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            Loading...
          </div>
        )}
        {!isLoading && config && Object.entries(config.codes).map(([code, node]) => {
          const label = node.response.split("\n")[0].trim()
          return (
            <button
              key={code}
              onClick={() => handleDial(code)}
              className="w-full text-left bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl px-4 py-3 transition-colors group">
              <span className="block font-mono text-xs text-teal-600 group-hover:text-teal-700 font-semibold mb-0.5">
                {code}
              </span>
              <span className="block text-sm text-gray-700 group-hover:text-gray-900 font-medium leading-snug">
                {label}
              </span>
            </button>
          )
        })}
        {!isLoading && (!config || Object.keys(config.codes).length === 0) && (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm text-center px-4">
            No USSD services configured.
            <br />
            Open USSD Config to add services.
          </div>
        )}
      </div>
    </div>
  )
}
