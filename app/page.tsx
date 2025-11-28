"use client"

import { useState, useEffect, useRef } from "react"
import Phone from "@/components/phone/Phone"
import PhoneNumberLogin from "@/components/phone/PhoneNumberLogin"
import { PhoneProvider, usePhone } from "@/contexts/PhoneContext"
import { useSMSReceiver } from "@/hooks/useSMSReceiver"
import { useEmailReceiver } from "@/hooks/useEmailReceiver"

function PhoneEmulator() {
  const sessionId = useSMSReceiver()
  const { addSMS } = usePhone()
  const [isLoaded, setIsLoaded] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { closeApp } = usePhone()

  // Escape key closes current app
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeApp()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeApp])

  // Connect to email SSE stream
  useEmailReceiver(phoneNumber && phoneNumber !== "skip" ? phoneNumber : null)

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    // Use a microtask to avoid the lint warning
    Promise.resolve().then(() => {
      const stored = localStorage.getItem("phone-number")
      setPhoneNumber(stored)
      setIsLoaded(true)
    })
  }, [])

  // Save phone number to localStorage when it changes
  useEffect(() => {
    if (phoneNumber && isLoaded) {
      localStorage.setItem("phone-number", phoneNumber)
    }
  }, [phoneNumber, isLoaded])

  // Connect to SSE stream for remote SMS messages when logged in with a phone number
  useEffect(() => {
    if (!phoneNumber || phoneNumber === "skip" || !isLoaded) return

    let isMounted = true

    // Close existing connection if any and wait for cleanup
    const connectToStream = async () => {
      if (eventSourceRef.current) {
        console.log("[SSE] Closing existing connection before creating new one")
        eventSourceRef.current.close()
        eventSourceRef.current = null
        // Wait longer for server-side cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (!isMounted) return

      console.log(`[SSE] Connecting to stream for ${phoneNumber}`)

      const eventSource = new EventSource(`/api/sms/stream?phoneNumber=${encodeURIComponent(phoneNumber)}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("[SSE] Connection established")
      }

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            console.log(`[SSE] Connected to phone number: ${data.phoneNumber}`)
            return
          }

          // Received SMS message
          if (data.sender && data.message) {
            console.log(`[SSE] Received message from ${data.sender}`)
            addSMS({ sender: data.sender, message: data.message })
          }
        } catch (error) {
          console.error("[SSE] Failed to parse message:", error)
        }
      }

      eventSource.onerror = error => {
        console.error("[SSE] Connection error:", error)
        // EventSource automatically reconnects
      }
    }

    connectToStream()

    // Cleanup on unmount or phone number change
    return () => {
      isMounted = false
      if (eventSourceRef.current) {
        console.log("[SSE] Closing connection")
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber, isLoaded]) // Removed addSMS to prevent re-renders

  const handleLogin = (number: string) => {
    setPhoneNumber(number || "skip") // "skip" means no phone number (anonymous mode)
  }

  const handleLogout = () => {
    setPhoneNumber(null)
    localStorage.removeItem("phone-number")
  }

  const handleOpenTester = () => {
    const testerUrl = `/tester?session=${encodeURIComponent(sessionId)}`
    window.open(testerUrl, "_blank")
    setIsDropdownOpen(false)
  }

  const handleOpenEmailTester = () => {
    window.open("/email-tester", "_blank")
    setIsDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Show loading state during hydration
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (phoneNumber === null) {
    return <PhoneNumberLogin onLogin={handleLogin} />
  }

  // Anonymous mode (skipped login)
  const isAnonymous = phoneNumber === "skip"
  const displayPhoneNumber = isAnonymous ? null : phoneNumber

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 p-8">
      <div className="phone-emulator">
        <Phone />

        {/* Phone Number & Tester Dropdown */}
        <div className="fixed top-4 right-4 flex items-center gap-3">
          {/* Phone Number Display - only show if logged in with a number */}
          {displayPhoneNumber && (
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <span className="font-mono font-medium text-gray-900">{displayPhoneNumber}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Logout">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Anonymous mode indicator */}
          {isAnonymous && (
            <div className="bg-gray-100 rounded-lg shadow-lg px-4 py-2 text-sm flex items-center gap-2">
              <span className="text-gray-600">Local Mode</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-blue-600 transition-colors text-xs underline"
                title="Login with phone number">
                Login
              </button>
            </div>
          )}

          {/* Tester Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Open testing tools">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <svg
                className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={handleOpenTester}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  SMS Tester
                </button>
                <button
                  onClick={handleOpenEmailTester}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email Tester
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <PhoneProvider>
      <PhoneEmulator />
    </PhoneProvider>
  )
}
