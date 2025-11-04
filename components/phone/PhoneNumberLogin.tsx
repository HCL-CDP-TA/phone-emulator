"use client"

import { useState } from "react"

interface PhoneNumberLoginProps {
  onLogin: (phoneNumber: string) => void
}

export default function PhoneNumberLogin({ onLogin }: PhoneNumberLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState("")

  const validatePhoneNumber = (number: string): boolean => {
    // Must start with + and contain only digits after that
    const regex = /^\+\d{10,15}$/
    return regex.test(number)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (e.g., +12345678901)")
      return
    }

    onLogin(phoneNumber)
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
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value)
                setError("")
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+12345678901"
              autoFocus
            />
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
