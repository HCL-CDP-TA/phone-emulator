"use client"

import { useState, useEffect } from "react"

interface PhoneNumberLoginProps {
  onLogin: (phoneNumber: string) => void
}

const STORAGE_KEY = "phone-numbers-history"

export default function PhoneNumberLogin({ onLogin }: PhoneNumberLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState("")
  const [savedNumbers, setSavedNumbers] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Load saved phone numbers from localStorage
  useEffect(() => {
    const loadSavedNumbers = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          setSavedNumbers(JSON.parse(saved))
        }
      } catch (error) {
        console.error("Failed to load saved phone numbers:", error)
      }
    }
    loadSavedNumbers()
  }, [])

  const validatePhoneNumber = (number: string): boolean => {
    // Must start with + and contain only digits after that
    const regex = /^\+\d{10,15}$/
    return regex.test(number)
  }

  const savePhoneNumber = (number: string) => {
    try {
      const updated = [number, ...savedNumbers.filter(n => n !== number)].slice(0, 10) // Keep max 10 numbers
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSavedNumbers(updated)
    } catch (error) {
      console.error("Failed to save phone number:", error)
    }
  }

  const removePhoneNumber = (numberToRemove: string) => {
    try {
      const updated = savedNumbers.filter(n => n !== numberToRemove)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSavedNumbers(updated)
    } catch (error) {
      console.error("Failed to remove phone number:", error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (e.g., +12345678901)")
      return
    }

    savePhoneNumber(phoneNumber)
    onLogin(phoneNumber)
  }

  const handleSelectNumber = (number: string) => {
    setPhoneNumber(number)
    setShowDropdown(false)
  }

  return (
    <div className="fixed inset-0 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Emulator</h1>
          <p className="text-gray-600">Enter your phone number to receive SMS messages</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={e => {
                  setPhoneNumber(e.target.value)
                  setError("")
                }}
                onFocus={() => savedNumbers.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+12345678901"
                autoFocus
              />
              {savedNumbers.length > 0 && (
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()} // Prevent blur on click
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-gray-500">Format: +[country code][number] (e.g., +12345678901)</p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg">
            Connect Phone
          </button>
        </form>

        <button
          type="button"
          onClick={() => onLogin("")}
          className="w-full mt-3 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg">
          Skip (use without phone number)
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Enter a phone number to receive SMS from external systems, or skip to use local testing only
          </p>
        </div>
      </div>
    </div>
  )
}
