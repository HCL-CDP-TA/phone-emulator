import { USSDSessionMetadata } from "@/types/ussd"

// PLMN lookup table: E.164 country prefix → { mcc, mnc }
// Keys tried longest-first (3-digit, then 2-digit, then 1-digit)
const PLMN_TABLE: Record<string, { mcc: string; mnc: string }> = {
  "254": { mcc: "639", mnc: "10" },  // Kenya – Safaricom
  "255": { mcc: "640", mnc: "02" },  // Tanzania – Vodacom
  "256": { mcc: "641", mnc: "10" },  // Uganda – MTN
  "234": { mcc: "234", mnc: "30" },  // UK – EE
  "233": { mcc: "620", mnc: "01" },  // Ghana – MTN
  "221": { mcc: "608", mnc: "01" },  // Senegal – Orange
  "212": { mcc: "604", mnc: "01" },  // Morocco – IAM
  "27":  { mcc: "655", mnc: "07" },  // South Africa – Vodacom
  "33":  { mcc: "208", mnc: "10" },  // France – SFR
  "49":  { mcc: "262", mnc: "01" },  // Germany – T-Mobile
  "44":  { mcc: "234", mnc: "30" },  // UK – EE (2-digit fallback)
  "91":  { mcc: "404", mnc: "20" },  // India – Vodafone
  "61":  { mcc: "505", mnc: "01" },  // Australia – Telstra
  "1":   { mcc: "310", mnc: "410" }, // US – AT&T
}

function lookupPlmn(phoneNumber: string): { mcc: string; mnc: string; plmn: string } {
  const digits = phoneNumber.replace(/\D/g, "").replace(/^0+/, "")
  for (const len of [3, 2, 1]) {
    const prefix = digits.slice(0, len)
    if (PLMN_TABLE[prefix]) {
      const { mcc, mnc } = PLMN_TABLE[prefix]
      return { mcc, mnc, plmn: mcc + mnc }
    }
  }
  return { mcc: "001", mnc: "01", plmn: "00101" }
}

// Linear Congruential Generator — deterministic, seeded per session
function createLCG(seed: number) {
  let state = seed >>> 0
  return function (): number {
    // Numerical Recipes LCG constants
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function zeroPad(value: number, length: number): string {
  return String(value).padStart(length, "0")
}

export function generateSessionMetadata(
  phoneNumber: string,
  sessionStartTime: number,
  imei?: string,
): USSDSessionMetadata {
  const { plmn } = lookupPlmn(phoneNumber)

  // MSIN: subscriber number digits padded/truncated to fill remaining IMSI digits
  const msinLength = 15 - plmn.length
  const subscriberDigits = phoneNumber.replace(/\D/g, "").slice(-msinLength)
  const imsi = plmn + subscriberDigits.padStart(msinLength, "0")

  // Seeded random — stable within a session
  const numericSeed = parseInt(phoneNumber.replace(/\D/g, "").slice(-8) || "0", 10)
  const seed = (numericSeed + (sessionStartTime % 0x100000000)) >>> 0
  const rand = createLCG(seed)

  const cellIdNum = Math.floor(rand() * 100000)
  const lacNum = Math.floor(rand() * 10000)
  const networkRoll = rand()
  const networkType: "2G" | "3G" | "4G" =
    networkRoll < 0.7 ? "4G" : networkRoll < 0.9 ? "3G" : "2G"
  const isRoaming = rand() < 0.1
  const signalDbm = Math.round(-55 - rand() * 40)

  return {
    imsi,
    imei: imei && imei.length === 15 ? imei : "000000000000000",
    cellId: zeroPad(cellIdNum, 5),
    lac: zeroPad(lacNum, 4),
    plmn,
    networkType,
    isRoaming,
    signalDbm,
  }
}
