"use client"

import { useState, useEffect, Suspense } from "react"
import { sendSMSToPhone } from "@/hooks/useSMSReceiver"
import { useSearchParams } from "next/navigation"

const STORAGE_KEY = "phone-numbers-history"

function TesterContent() {
  const searchParams = useSearchParams()
  const [sender, setSender] = useState("Unitel")
  const [message, setMessage] = useState(
    "Hello! Check out our amazing offer: https://telco.demo.now.hclsoftware.cloud/en-US/unitel?utm_source=sms&utm_medium=sms&utm_campaign=summer-sale",
  )
  const [status, setStatus] = useState("")
  const [sessionId] = useState(() => searchParams.get("session") || "")
  const [deliveryMethod, setDeliveryMethod] = useState<"local" | "remote">("remote")
  const [phoneNumber, setPhoneNumber] = useState("+12345678901")
  const [isLoaded, setIsLoaded] = useState(false)
  const [savedNumbers, setSavedNumbers] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    Promise.resolve().then(() => {
      const storedPhoneNumber = localStorage.getItem("phone-number")
      const storedDeliveryMethod = localStorage.getItem("tester-delivery-method") as "local" | "remote" | null

      // Load saved phone numbers history
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          setSavedNumbers(JSON.parse(saved))
        }
      } catch (error) {
        console.error("Failed to load saved phone numbers:", error)
      }

      if (storedPhoneNumber && storedPhoneNumber !== "skip") {
        setPhoneNumber(storedPhoneNumber)
      }
      if (storedDeliveryMethod) {
        setDeliveryMethod(storedDeliveryMethod)
      }
      setIsLoaded(true)
    })
  }, [])

  // Save phone number to localStorage when it changes
  useEffect(() => {
    if (phoneNumber && isLoaded) {
      localStorage.setItem("phone-number", phoneNumber)
    }
  }, [phoneNumber, isLoaded])

  // Save delivery method to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("tester-delivery-method", deliveryMethod)
    }
  }, [deliveryMethod, isLoaded])

  const removePhoneNumber = (numberToRemove: string) => {
    try {
      const updated = savedNumbers.filter(n => n !== numberToRemove)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSavedNumbers(updated)
    } catch (error) {
      console.error("Failed to remove phone number:", error)
    }
  }

  const handleSelectNumber = (number: string) => {
    setPhoneNumber(number)
    setShowDropdown(false)
  }

  const handleSendSMS = async () => {
    try {
      // Build request body based on delivery method
      const requestBody = deliveryMethod === "remote" ? { phoneNumber, sender, message } : { sender, message }

      // Call the API endpoint
      const response = await fetch("/api/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        if (deliveryMethod === "local") {
          // Trigger the SMS on the phone using BroadcastChannel
          sendSMSToPhone(sender, message, sessionId)
        }
        setStatus(`✅ SMS sent successfully via ${deliveryMethod === "remote" ? "remote" : "local"} delivery!`)
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

            {!sessionId && deliveryMethod === "local" && (
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

            {/* Delivery Method Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Method</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeliveryMethod("local")}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    deliveryMethod === "local"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                    </svg>
                    <span>Local (Same Browser)</span>
                  </div>
                  {deliveryMethod === "local" && (
                    <div className="text-xs mt-1 text-blue-600">Uses BroadcastChannel</div>
                  )}
                </button>
                <button
                  onClick={() => setDeliveryMethod("remote")}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    deliveryMethod === "remote"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>Remote (Phone Number)</span>
                  </div>
                  {deliveryMethod === "remote" && <div className="text-xs mt-1 text-purple-600">Uses SSE/API</div>}
                </button>
              </div>
            </div>

            {/* Phone Number Input (only for remote delivery) */}
            {deliveryMethod === "remote" && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    onFocus={() => savedNumbers.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    placeholder="+12345678901"
                  />
                  {savedNumbers.length > 0 && (
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dropdown with saved numbers */}
                {showDropdown && savedNumbers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1">Previously Used Numbers</div>
                      {savedNumbers.map(number => (
                        <div
                          key={number}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded group">
                          <button
                            type="button"
                            onClick={() => handleSelectNumber(number)}
                            className="flex-1 text-left text-gray-900 font-mono">
                            {number}
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              removePhoneNumber(number)
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  💡 Enter the phone number that the target phone is logged in with
                </p>
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
              className={`w-full text-white py-3 px-6 rounded-lg transition-colors font-medium text-lg ${
                deliveryMethod === "local" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-500 hover:bg-purple-600"
              }`}>
              {deliveryMethod === "local" ? "Send SMS (Local)" : "Send SMS (Remote)"}
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
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Local Mode:</strong> Open this page in a separate window or tab alongside the phone emulator.
                Messages will be sent in the background and appear as notifications on the phone.
              </p>
              <p>
                <strong>Remote Mode:</strong> Send SMS to any phone logged in with the specified phone number, even from
                a different browser or computer. The phone must be online and logged in to receive messages instantly
                via Server-Sent Events.
              </p>
            </div>
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
