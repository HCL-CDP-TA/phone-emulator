"use client"

import { useState, useEffect, Suspense } from "react"
import { industryProfiles, generateIndustryLogoUrl } from "@/components/apps/industryProfiles"

const STORAGE_KEY = "phone-numbers-history"

interface ButtonConfig {
  id: string
  text: string
  type: "quick_reply" | "url" | "custom"
  url?: string
}

function TesterContent() {
  const [sender, setSender] = useState("Demo Shop")
  const [senderNumber, setSenderNumber] = useState("+15555551234")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [message, setMessage] = useState("Your order #12345 is ready for pickup!")
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { id: "btn1", text: "Confirm Pickup", type: "quick_reply" },
    { id: "btn2", text: "View Order", type: "url", url: "https://example.com/order/12345" },
  ])
  const [status, setStatus] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("+12345678901")
  const [isLoaded, setIsLoaded] = useState(false)
  const [savedNumbers, setSavedNumbers] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string>("")

  // Handle industry selection
  const handleIndustrySelect = (industryId: string) => {
    if (!industryId) {
      setSelectedIndustry("")
      return
    }

    const industry = industryProfiles.find(i => i.id === industryId)
    if (!industry) return

    setSelectedIndustry(industryId)
    setSender(industry.defaultCompanyName)
    const logoUrl = generateIndustryLogoUrl(industryId)
    setProfilePictureUrl(logoUrl)
  }

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    Promise.resolve().then(() => {
      const storedPhoneNumber = localStorage.getItem("phone-number")

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

      setIsLoaded(true)
    })
  }, [])

  // Save phone number to localStorage when it changes
  useEffect(() => {
    if (phoneNumber && isLoaded) {
      localStorage.setItem("phone-number", phoneNumber)

      // Save to history if not already there
      if (!savedNumbers.includes(phoneNumber)) {
        const updated = [...savedNumbers, phoneNumber]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        setSavedNumbers(updated)
      }
    }
  }, [phoneNumber, isLoaded, savedNumbers])

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

  const addButton = () => {
    const newButton: ButtonConfig = {
      id: `btn${buttons.length + 1}`,
      text: "New Button",
      type: "quick_reply",
    }
    setButtons([...buttons, newButton])
  }

  const updateButton = (index: number, field: keyof ButtonConfig, value: string) => {
    const updated = [...buttons]
    if (field === "type") {
      updated[index][field] = value as ButtonConfig["type"]
      // Clear URL if not URL type
      if (value !== "url") {
        delete updated[index].url
      }
    } else {
      updated[index][field] = value
    }
    setButtons(updated)
  }

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index))
  }

  const loadTemplate = (template: "order" | "support" | "promo") => {
    switch (template) {
      case "order":
        setSender("Demo Shop")
        setSenderNumber("+15555551234")
        setMessage("Your order #12345 is ready for pickup!")
        setButtons([
          { id: "btn1", text: "Confirm Pickup", type: "quick_reply" },
          { id: "btn2", text: "View Order", type: "url", url: "https://example.com/order/12345" },
        ])
        break
      case "support":
        setSender("Customer Support")
        setSenderNumber("+15555555678")
        setMessage("Hi! How can we help you today?")
        setButtons([
          { id: "btn1", text: "Track Order", type: "quick_reply" },
          { id: "btn2", text: "Return Item", type: "quick_reply" },
          { id: "btn3", text: "Contact Agent", type: "quick_reply" },
        ])
        break
      case "promo":
        setSender("Marketing Team")
        setSenderNumber("+15555559999")
        setMessage("🎉 Special offer just for you! Get 20% off your next purchase.")
        setButtons([
          { id: "btn1", text: "Shop Now", type: "url", url: "https://example.com/shop" },
          { id: "btn2", text: "View Details", type: "url", url: "https://example.com/promo" },
        ])
        break
    }
  }

  const handleSendMessage = async () => {
    setIsLoading(true)
    try {
      const requestBody = {
        phoneNumber,
        sender,
        senderNumber: senderNumber || undefined,
        profilePictureUrl: profilePictureUrl || undefined,
        message,
        buttons: buttons.length > 0 ? buttons : undefined,
      }

      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus(`✅ WhatsApp message sent successfully!`)
      } else {
        setStatus(`❌ Failed to send: ${data.error || data.message}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }

    // Clear status after 3 seconds
    setTimeout(() => setStatus(""), 3000)
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">WhatsApp Message Tester</h1>
            <p className="text-gray-600">Send test WhatsApp messages to your phone emulator</p>
          </div>

          {/* Template Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="flex gap-2">
              <button
                onClick={() => loadTemplate("order")}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium">
                Order Confirmation
              </button>
              <button
                onClick={() => loadTemplate("support")}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium">
                Support Request
              </button>
              <button
                onClick={() => loadTemplate("promo")}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium">
                Promotional
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Recipient)</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  onFocus={() => savedNumbers.length > 0 && setShowDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                  placeholder="+12345678901"
                />
                {showDropdown && savedNumbers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                      Previously Used Numbers
                    </div>
                    {savedNumbers.map(number => (
                      <div
                        key={number}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group">
                        <button onClick={() => handleSelectNumber(number)} className="flex-1 text-left font-mono">
                          {number}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            removePhoneNumber(number)
                          }}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Demo Shop"
              />
            </div>

            {/* Sender Number (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={senderNumber}
                onChange={e => setSenderNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                placeholder="+15555551234"
              />
            </div>

            {/* Profile Picture URL (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture <span className="text-gray-400">(optional)</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedIndustry}
                  onChange={e => handleIndustrySelect(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
                  <option value="">-- Select Industry --</option>
                  {industryProfiles.map(industry => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
                <span className="text-gray-400 self-center">OR</span>
                <input
                  type="url"
                  value={profilePictureUrl}
                  onChange={e => {
                    setProfilePictureUrl(e.target.value)
                    setSelectedIndustry("") // Clear industry selection when manually entering URL
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Paste custom URL"
                />
              </div>
              {profilePictureUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={profilePictureUrl}
                    alt="Avatar preview"
                    className="w-12 h-12 rounded-full border-2 border-gray-200"
                    onError={e => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Preview</span>
                    {selectedIndustry && (
                      <span className="text-xs text-gray-600 font-medium">
                        {industryProfiles.find(i => i.id === selectedIndustry)?.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your message here..."
              />
            </div>

            {/* Interactive Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Interactive Buttons</label>
                <button
                  onClick={addButton}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                  <span className="text-lg">+</span> Add Button
                </button>
              </div>
              <div className="space-y-3">
                {buttons.map((button, index) => (
                  <div key={button.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={button.text}
                        onChange={e => updateButton(index, "text", e.target.value)}
                        placeholder="Button text"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={button.type}
                        onChange={e => updateButton(index, "type", e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm">
                        <option value="quick_reply">Quick Reply</option>
                        <option value="url">URL</option>
                        <option value="custom">Custom</option>
                      </select>
                      <button onClick={() => removeButton(index)} className="text-red-500 hover:text-red-700 px-2">
                        ✕
                      </button>
                    </div>
                    {button.type === "url" && (
                      <input
                        type="url"
                        value={button.url || ""}
                        onChange={e => updateButton(index, "url", e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    )}
                  </div>
                ))}
                {buttons.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No buttons added. Click "Add Button" to create interactive buttons.
                  </p>
                )}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !sender || !message || !phoneNumber}
              className="w-full bg-[#25D366] text-white py-3 rounded-lg font-semibold hover:bg-[#20BA5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                "Send WhatsApp Message"
              )}
            </button>

            {/* Status Message */}
            {status && (
              <div
                className={`p-3 rounded-lg text-center font-medium ${
                  status.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                {status}
              </div>
            )}
          </div>

          {/* API Documentation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">API Documentation</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Endpoint:</p>
                <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                  POST /api/whatsapp
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Example Request:</p>
                <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto">
                  {`curl -X POST https://phone-emulator.demo.now.hclsoftware.cloud/api/whatsapp \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "${phoneNumber}",
    "sender": "${sender}",
    "senderNumber": "${senderNumber}",
    "profilePictureUrl": "${profilePictureUrl || "https://example.com/avatar.jpg"}",
    "message": "${message}",
    "buttons": [
      {
        "id": "btn1",
        "text": "Confirm",
        "type": "quick_reply"
      },
      {
        "id": "btn2",
        "text": "View More",
        "type": "url",
        "url": "https://example.com"
      }
    ]
  }'`}
                </pre>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Phone number must match the logged-in phone on the emulator</li>
              <li>Select an industry to get a professional company logo and name</li>
              <li>Profile pictures will fallback to initials if URL fails to load</li>
              <li>URL buttons will open in the phone's browser app</li>
              <li>Quick reply buttons send callbacks to the API for tracking</li>
              <li>Use templates to quickly test different message types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppTester() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TesterContent />
    </Suspense>
  )
}
