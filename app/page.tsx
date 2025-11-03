"use client"

import Phone from "@/components/phone/Phone"
import SMSTester from "@/components/SMSTester"
import { PhoneProvider } from "@/contexts/PhoneContext"
import { useSMSReceiver } from "@/hooks/useSMSReceiver"

function PhoneEmulator() {
  const sessionId = useSMSReceiver()

  const handleOpenTester = () => {
    const testerUrl = `/tester?session=${encodeURIComponent(sessionId)}`
    window.open(testerUrl, "_blank")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 p-8">
      <div className="phone-emulator">
        <Phone />
        <SMSTester />

        {/* Tester Link */}
        <button
          onClick={handleOpenTester}
          className="fixed top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
          title="Open SMS Tester in new window">
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
