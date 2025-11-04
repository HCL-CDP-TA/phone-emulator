"use client"

import { useState, Suspense } from "react"
import { sendSMSToPhone } from "@/hooks/useSMSReceiver"
import { useSearchParams } from "next/navigation"

function TesterContent() {
  const searchParams = useSearchParams()
  const [sender, setSender] = useState("Unitel")
  const [message, setMessage] = useState(
    "Hello! Check out our amazing offer: https://telco.demo.now.hclsoftware.cloud/en-US/unitel&utm_source=sms&utm_medium=sms&utm_campaign=summer-sale",
  )
  const [status, setStatus] = useState("")
  const [sessionId] = useState(() => searchParams.get("session") || "")

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
        // Trigger the SMS on the phone using BroadcastChannel
        sendSMSToPhone(sender, message, sessionId)
        setStatus("✅ SMS sent successfully!")
      } else {
        setStatus(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    }

    setTimeout(() => setStatus(""), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">SMS Tester</h1>
          <p className="text-gray-600 mb-6">Send test SMS messages to the phone emulator</p>

          <div className="space-y-4">
            {sessionId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm text-green-900">Connected to phone</p>
                    <p className="text-xs text-green-700 mt-1 font-mono break-all">{sessionId}</p>
                  </div>
                </div>
              </div>
            )}

            {!sessionId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm text-yellow-900">No phone session</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Open this page from the phone emulator to automatically connect.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Demo Company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Enter your message with links..."
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 URLs in messages will be automatically displayed as shortened links on the phone
              </p>
            </div>

            <button
              onClick={handleSendSMS}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg">
              Send SMS
            </button>

            {status && (
              <div className="text-center py-3 px-4 rounded-lg bg-gray-50 text-base font-medium">{status}</div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">API Documentation</h2>
            <p className="text-sm text-gray-600 mb-3">Send SMS via API from external systems:</p>

            {/* Same-browser delivery */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">For same-browser delivery (using session ID):</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400">POST</div>
                <div className="mt-2">/api/sms</div>
                <div className="mt-2 text-gray-400">{"{"}</div>
                <div className="ml-4">
                  <span className="text-blue-400">"sender"</span>:{" "}
                  <span className="text-yellow-400">"Demo Company"</span>,
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">"message"</span>:{" "}
                  <span className="text-yellow-400">"Your message here"</span>
                </div>
                <div className="text-gray-400">{"}"}</div>
              </div>
            </div>

            {/* Remote delivery */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">For remote delivery (from external systems):</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400">POST</div>
                <div className="mt-2">/api/sms</div>
                <div className="mt-2 text-gray-400">{"{"}</div>
                <div className="ml-4">
                  <span className="text-blue-400">"phoneNumber"</span>:{" "}
                  <span className="text-yellow-400">"+12345678901"</span>,
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">"sender"</span>:{" "}
                  <span className="text-yellow-400">"Demo Company"</span>,
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">"message"</span>:{" "}
                  <span className="text-yellow-400">"Your message here"</span>
                </div>
                <div className="text-gray-400">{"}"}</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 The phone must be logged in with the specified phone number to receive the message.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
            <p className="text-sm text-blue-800">
              Open this page in a separate window or tab alongside the phone emulator. Messages will be sent in the
              background and appear as notifications on the phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TesterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>}>
      <TesterContent />
    </Suspense>
  )
}
