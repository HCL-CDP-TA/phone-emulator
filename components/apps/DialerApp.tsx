"use client"

import { useState, useEffect } from "react"
import { AppProps } from "@/types/app"

type SessionState = "idle" | "loading" | "active" | "ended" | "imei"

const KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
]

const USSD_PATTERN = /^\*[0-9*]+#$/

// ── IMEI generation (Luhn algorithm) ────────────────────────────────────────
// Real TAC prefixes (8 digits) from common manufacturers
const TAC_PREFIXES = [
  "35397010", // Apple iPhone
  "35299406", // Apple iPhone
  "35674108", // Samsung Galaxy
  "35267000", // Samsung Galaxy
  "86811903", // Huawei
  "86724102", // Xiaomi
  "35445204", // OnePlus
  "35342500", // Google Pixel
]

function luhnCheckDigit(digits: string): number {
  // Double every even-indexed digit (1-indexed: positions 2, 4, 6, …)
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = parseInt(digits[i])
    if ((i + 1) % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return (10 - (sum % 10)) % 10
}

function generateIMEI(): string {
  const tac = TAC_PREFIXES[Math.floor(Math.random() * TAC_PREFIXES.length)]
  let serial = ""
  while (serial.length < 6) serial += Math.floor(Math.random() * 10)
  const payload = tac + serial // 14 digits
  return payload + luhnCheckDigit(payload)
}

function getOrCreateIMEI(): string {
  const stored = localStorage.getItem("device-imei")
  if (stored && stored.length === 15) return stored
  const imei = generateIMEI()
  localStorage.setItem("device-imei", imei)
  return imei
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DialerApp({ onClose }: AppProps) {
  const [display, setDisplay] = useState("")
  const [sessionState, setSessionState] = useState<SessionState>("idle")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [ussdText, setUssdText] = useState("")
  const [networkName, setNetworkName] = useState("Network")
  const [dialedCode, setDialedCode] = useState("")
  const [requiresInput, setRequiresInput] = useState(false)
  const [imei, setImei] = useState("")

  useEffect(() => {
    setImei(getOrCreateIMEI())
  }, [])

  // Listen for ussd-dial events dispatched by the USSD panel
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent<{ code: string }>).detail.code
      triggerUSSD(code)
    }
    window.addEventListener("ussd-dial", handler)
    return () => window.removeEventListener("ussd-dial", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const phoneNumber =
    typeof window !== "undefined" ? localStorage.getItem("phone-number") || "unknown" : "unknown"

  // ── Keypad press ──────────────────────────────────────────────────────────
  function handleKey(digit: string) {
    if (sessionState === "loading") return

    // USSD active — menu selection fires immediately; free-text accumulates
    if (sessionState === "active") {
      if (!requiresInput) {
        // Single keypress = immediate send (numbered menu)
        sendUSSDReply(digit)
      } else {
        setDisplay(prev => prev + digit)
      }
      return
    }

    // IMEI / ended — keypad is inactive (wait for OK)
    if (sessionState === "imei" || sessionState === "ended") return

    // Idle — build dialled number
    const next = display + digit
    setDisplay(next)

    if (digit === "#") {
      if (next === "*#06#") {
        // IMEI code — local, no network
        setDialedCode(next)
        setSessionState("imei")
        setDisplay("")
        return
      }
      if (USSD_PATTERN.test(next)) {
        triggerUSSD(next)
      }
    }
  }

  function handleBackspace() {
    if (sessionState === "loading" || sessionState === "imei" || sessionState === "ended") return
    setDisplay(prev => prev.slice(0, -1))
  }

  // ── USSD session ──────────────────────────────────────────────────────────
  async function triggerUSSD(code: string) {
    setDialedCode(code)
    setDisplay("")
    setSessionState("loading")
    try {
      const res = await fetch("/api/ussd/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, ussdCode: code }),
      })
      const data = await res.json()
      setNetworkName(data.networkName ?? "Network")
      setUssdText(data.response)
      setRequiresInput(!!data.requiresInput)
      if (data.sessionActive && data.sessionId) {
        setSessionId(data.sessionId)
        setSessionState("active")
      } else {
        setSessionId(null)
        setSessionState("ended")
      }
    } catch {
      setUssdText("Network error. Please try again.")
      setSessionState("ended")
    }
  }

  async function sendUSSDReply(input: string) {
    if (!sessionId) return
    setDisplay("")
    setSessionState("loading")
    try {
      const res = await fetch("/api/ussd/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, input }),
      })
      const data = await res.json()
      setUssdText(data.response)
      setRequiresInput(!!data.requiresInput)
      if (data.sessionActive && data.sessionId) {
        setSessionId(data.sessionId)
        setSessionState("active")
      } else {
        setSessionId(null)
        setSessionState("ended")
      }
    } catch {
      setUssdText("Network error. Please try again.")
      setSessionState("ended")
    }
  }

  // ── Green button ──────────────────────────────────────────────────────────
  async function handleGreenButton() {
    if (sessionState === "loading") return

    if (sessionState === "idle") {
      if (!display) return
      if (display === "*#06#") {
        setDialedCode(display)
        setSessionState("imei")
        setDisplay("")
        return
      }
      if (USSD_PATTERN.test(display)) triggerUSSD(display)
      return
    }

    // Free-text input nodes — send whatever is in the display
    if (sessionState === "active" && requiresInput) {
      if (!display.trim()) return
      sendUSSDReply(display.trim())
    }
  }

  // ── OK / dismiss ──────────────────────────────────────────────────────────
  function handleOK() {
    setSessionId(null)
    setSessionState("idle")
    setUssdText("")
    setDisplay("")
    setDialedCode("")
    setRequiresInput(false)
  }

  const inSession = sessionState !== "idle"
  const showOK = sessionState === "ended" || sessionState === "imei"

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Back button */}
      <button
        onClick={onClose}
        className="absolute top-12 left-4 z-10 p-1 text-gray-400 hover:text-gray-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Top area ── */}
      <div className="flex-1 flex flex-col justify-end pb-2 px-4">

        {/* USSD message card */}
        {(sessionState === "loading" || sessionState === "active" || sessionState === "ended") && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                {networkName}
              </span>
              <span className="text-xs text-gray-400 font-mono">{dialedCode}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 max-h-52 overflow-y-auto">
              {sessionState === "loading" ? (
                <div className="flex items-center gap-2 py-2 text-gray-500">
                  <svg className="animate-spin h-4 w-4 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Connecting...</span>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {ussdText}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* IMEI card */}
        {sessionState === "imei" && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Device Info</span>
              <span className="text-xs text-gray-400 font-mono">{dialedCode}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">IMEI</p>
              <p className="text-2xl font-mono font-light tracking-widest text-gray-900">
                {imei.slice(0, 5)}&thinsp;{imei.slice(5, 10)}&thinsp;{imei.slice(10, 14)}&thinsp;{imei.slice(14)}
              </p>
            </div>
          </div>
        )}

        {/* Display / reply field */}
        <div className="flex items-center justify-center min-h-[64px] px-2">
          {display ? (
            <div className="flex items-center gap-3 w-full justify-center">
              <span className="text-4xl font-light tracking-widest text-gray-900 flex-1 text-center">
                {display}
              </span>
              <button
                onPointerDown={e => { e.preventDefault(); handleBackspace() }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </button>
            </div>
          ) : (
            <span className="text-gray-300 text-2xl font-light">
              {inSession && sessionState !== "imei" ? "Enter option…" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Keypad ── */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-y-3 gap-x-4 mb-5">
          {KEYS.map(({ digit, letters }) => (
            <button
              key={digit}
              onPointerDown={e => { e.preventDefault(); handleKey(digit) }}
              className="flex flex-col items-center justify-center h-14 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors">
              <span className="text-2xl font-light text-gray-900 leading-none">{digit}</span>
              {letters && (
                <span className="text-[9px] text-gray-500 tracking-widest mt-0.5">{letters}</span>
              )}
            </button>
          ))}
        </div>

        {/* Single centred action button */}
        <div className="flex justify-center">
          {showOK ? (
            <button
              onPointerDown={e => { e.preventDefault(); handleOK() }}
              className="w-14 h-14 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 transition-colors flex items-center justify-center shadow-sm text-gray-700 font-semibold text-sm">
              OK
            </button>
          ) : (
            <button
              onPointerDown={e => { e.preventDefault(); handleGreenButton() }}
              disabled={sessionState === "loading" || (!display && sessionState === "idle")}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:opacity-30 transition-colors flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
