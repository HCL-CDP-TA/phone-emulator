"use client"

import { AppProps } from "@/types/app"

export default function CalculatorApp({ onClose }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white hover:text-gray-300 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
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
