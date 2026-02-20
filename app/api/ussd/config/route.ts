import { NextResponse } from "next/server"
import { readFileSync, writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { USSDConfig } from "@/types/ussd"
import { DEFAULT_USSD_CONFIG } from "@/lib/ussdDefaults"

const CONFIG_FILE = join(process.cwd(), "ussd-config.json")

function loadFromDisk(): USSDConfig {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8")
    const parsed = JSON.parse(raw) as USSDConfig
    if (parsed.codes && typeof parsed.codes === "object") {
      console.log("[USSD] Loaded config from ussd-config.json")
      return parsed
    }
  } catch {
    // File doesn't exist or is invalid — fall through to defaults
  }
  console.log("[USSD] No ussd-config.json found, using built-in defaults")
  return { ...DEFAULT_USSD_CONFIG }
}

function saveToDisk(config: USSDConfig): void {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
    console.log("[USSD] Config saved to ussd-config.json")
  } catch (err) {
    console.warn("[USSD] Could not write ussd-config.json:", err)
  }
}

// Module-level singleton — loaded from disk on first import, shared with session route
let currentConfig: USSDConfig = loadFromDisk()

export function getUSSDConfig(): USSDConfig {
  return currentConfig
}

export async function GET() {
  return NextResponse.json({ success: true, data: currentConfig })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.codes || typeof body.codes !== "object") {
      return NextResponse.json({ error: "Missing or invalid 'codes' field" }, { status: 400 })
    }

    currentConfig = {
      codes: body.codes,
      networkName: typeof body.networkName === "string" ? body.networkName : currentConfig.networkName,
    }

    saveToDisk(currentConfig)

    return NextResponse.json({ success: true, data: currentConfig })
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}

export async function DELETE() {
  // Remove the saved file so defaults are used on next start
  try {
    unlinkSync(CONFIG_FILE)
    console.log("[USSD] ussd-config.json deleted, reverted to defaults")
  } catch {
    // File didn't exist — fine
  }
  currentConfig = { ...DEFAULT_USSD_CONFIG }
  return NextResponse.json({ success: true, data: currentConfig, message: "Config reset to defaults" })
}
