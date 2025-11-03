"use client"

import { AppProps } from "@/types/app"

export default function CalculatorApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white font-medium">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Calculator</h1>
        <div className="w-16" />
      </div>
      <div className="flex-1 flex items-center justify-center text-center p-8 opacity-70">
        <p>Calculator functionality not available in demo</p>
      </div>
    </div>
  )
}
