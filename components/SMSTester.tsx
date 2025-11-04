"use client"

import { useState } from "react"
import { sendSMSToPhone } from "@/hooks/useSMSReceiver"

export default function SMSTester() {
  const [isMinimized, setIsMinimized] = useState(true)
  const [sender, setSender] = useState("Unitel")
  const [message, setMessage] = useState(
    "Hello! Check out our amazing offer: https://telco.demo.now.hclsoftware.cloud/en-US/unitel?utm_source=sms&utm_medium=sms&utm_campaign=summer-sale",
  )
  const [status, setStatus] = useState("")

  const handleSendSMS = async () => {
    try {
      // Call the API endpoint
      const response = await fetch("/api/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender, message }),
      })

      const data = await response.json()

      if (response.ok) {
        // Trigger the SMS on the phone
        sendSMSToPhone(sender, message)
        setStatus("✅ SMS sent successfully!")
      } else {
        setStatus(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    }

    setTimeout(() => setStatus(""), 3000)
  }

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-8 right-8 bg-blue-500 rounded-full shadow-xl border border-blue-600">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 flex items-center justify-center text-white hover:bg-blue-600 rounded-full transition-colors"
          aria-label="Open SMS Tester"
          title="Open SMS Tester">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    )
  }

  // Expanded view
  return (
    <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-xl w-80 border border-gray-200">
      {/* Header with minimize button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">SMS Tester</h3>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          aria-label="Minimize"
          title="Minimize">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
            <input
              type="text"
              value={sender}
              onChange={e => setSender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., Demo Company"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={4}
              placeholder="Enter your message with links..."
            />
          </div>
          <button
            onClick={handleSendSMS}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium">
            Send SMS
          </button>
          {status && <div className="text-sm text-center mt-2">{status}</div>}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>You can also send via API:</p>
          <code className="block mt-1 p-2 bg-gray-50 rounded text-xs">
            POST /api/sms
            <br />
            {"{"}sender, message{"}"}
          </code>
        </div>
      </div>
    </div>
  )
}
