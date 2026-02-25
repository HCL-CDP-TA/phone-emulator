import { NextResponse } from "next/server"
import { ApiClient, ApiConfiguration, ApiRequest, UserIdentity, UserIdentityType, EventType } from "@hcl-cdp-ta/cdp-node-sdk"
import { USSDSession, USSDNode, USSDCDPEvent } from "@/types/ussd"
import { getUSSDConfig } from "../config/route"
import { generateSessionMetadata } from "@/lib/ussdSessionMetadata"

// In-memory session store
const sessions = new Map<string, USSDSession>()

// Clean up sessions older than 5 minutes
const SESSION_TIMEOUT_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions.entries()) {
    if (now - session.startedAt > SESSION_TIMEOUT_MS) {
      fireCDPEvent(session, {
        eventId: "ussd_session_abandoned",
        properties: { channel: "ussd", service_code: session.rootCode },
      }).catch(() => {})
      sessions.delete(id)
    }
  }
}, 60_000)

function generateSessionId(): string {
  return `ussd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Resolve placeholders in CDP event properties.
// Supports $input/$input_prev/$input_prev2 (input buffer) and
// network/session metadata placeholders from the session.
function resolveProperties(
  props: Record<string, string | number | boolean> | undefined,
  session: USSDSession,
): Record<string, string | number | boolean> {
  if (!props) return {}
  const { inputBuffer, metadata, history, startedAt } = session
  const resolved: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") {
      switch (value) {
        // Input buffer placeholders
        case "$input":
          resolved[key] = inputBuffer.length >= 1 ? inputBuffer[inputBuffer.length - 1] : value
          break
        case "$input_prev":
          resolved[key] = inputBuffer.length >= 2 ? inputBuffer[inputBuffer.length - 2] : value
          break
        case "$input_prev2":
          resolved[key] = inputBuffer.length >= 3 ? inputBuffer[inputBuffer.length - 3] : value
          break
        // Network metadata placeholders (string values)
        case "$imsi":
          resolved[key] = metadata.imsi
          break
        case "$imei":
          resolved[key] = metadata.imei
          break
        case "$cell_id":
          resolved[key] = metadata.cellId
          break
        case "$lac":
          resolved[key] = metadata.lac
          break
        case "$plmn":
          resolved[key] = metadata.plmn
          break
        case "$network_type":
          resolved[key] = metadata.networkType
          break
        // Boolean placeholder — replaces entire value
        case "$is_roaming":
          resolved[key] = metadata.isRoaming
          break
        // Number placeholders — replaces entire value
        case "$signal_dbm":
          resolved[key] = metadata.signalDbm
          break
        case "$session_path":
          resolved[key] = history.join(">")
          break
        case "$session_depth":
          resolved[key] = history.length
          break
        case "$session_duration_s":
          resolved[key] = Math.round((Date.now() - startedAt) / 1000)
          break
        default:
          resolved[key] = value
      }
    } else {
      resolved[key] = value
    }
  }
  return resolved
}

async function fireCDPEvent(session: USSDSession, event: USSDCDPEvent): Promise<void> {
  const apiKey = process.env.CDP_API_KEY
  const passKey = process.env.CDP_PASS_KEY

  if (!apiKey || !passKey) {
    console.log(`[USSD] CDP not configured, skipping event: "${event.eventId}"`)
    return
  }

  try {
    const config = new ApiConfiguration(apiKey, passKey)
    const client = new ApiClient(config)
    const identity = new UserIdentity(UserIdentityType.Primary, "userId", session.phoneNumber)

    // Base properties auto-merged into every event
    const baseProperties: Record<string, string | number | boolean> = {
      imsi: session.metadata.imsi,
      imei: session.metadata.imei,
      cell_id: session.metadata.cellId,
      lac: session.metadata.lac,
      plmn: session.metadata.plmn,
      network_type: session.metadata.networkType,
      is_roaming: session.metadata.isRoaming,
      signal_dbm: session.metadata.signalDbm,
      session_path: session.history.join(">"),
      session_depth: session.history.length,
      session_duration_s: Math.round((Date.now() - session.startedAt) / 1000),
    }

    // Node-defined properties override base (allows rename/override if desired)
    const mergedProps = { ...baseProperties, ...resolveProperties(event.properties, session) }

    const apiRequest = new ApiRequest(EventType.Track, event.eventId, identity, mergedProps)
    const response = await client.sendEvent(apiRequest)
    console.log(`[USSD] CDP event fired: "${event.eventId}" for ${session.phoneNumber} — ${response.response?.message ?? "ok"}`)
  } catch (err) {
    console.warn(`[USSD] CDP event failed (non-fatal):`, err instanceof Error ? err.message : err)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const config = getUSSDConfig()
    const networkName = config.networkName ?? "Network"

    // --- New session ---
    if (body.ussdCode) {
      const { phoneNumber, ussdCode, imei } = body

      if (!phoneNumber || !ussdCode) {
        return NextResponse.json({ error: "Missing phoneNumber or ussdCode" }, { status: 400 })
      }

      const rootNode: USSDNode | undefined = config.codes[ussdCode]

      if (!rootNode) {
        return NextResponse.json(
          {
            sessionId: null,
            response: `Service unavailable.\n${ussdCode} is not a recognised service.`,
            sessionActive: false,
            requiresInput: false,
            networkName,
          },
          { status: 200 },
        )
      }

      const sessionId = generateSessionId()
      const startedAt = Date.now()
      const metadata = generateSessionMetadata(phoneNumber, startedAt, imei)

      const session: USSDSession = {
        sessionId,
        phoneNumber,
        currentNode: rootNode,
        rootCode: ussdCode,
        history: [],
        inputBuffer: [],
        startedAt,
        metadata,
      }
      sessions.set(sessionId, session)

      if (rootNode.cdpEvent) {
        fireCDPEvent(session, rootNode.cdpEvent)
      }

      const sessionActive = !rootNode.sessionEnd
      if (!sessionActive) {
        sessions.delete(sessionId)
      }

      return NextResponse.json({
        sessionId: sessionActive ? sessionId : null,
        response: rootNode.response,
        sessionActive,
        requiresInput: !!rootNode.isInput,
        networkName,
        sessionMetadata: {
          networkType: metadata.networkType,
          isRoaming: metadata.isRoaming,
          cellId: metadata.cellId,
          signalDbm: metadata.signalDbm,
        },
      })
    }

    // --- Continue session ---
    if (body.sessionId) {
      const { sessionId, input } = body

      if (!input && input !== "0") {
        return NextResponse.json({ error: "Missing input" }, { status: 400 })
      }

      const session = sessions.get(sessionId)
      if (!session) {
        return NextResponse.json({ error: "Session not found or expired" }, { status: 404 })
      }

      const currentNode = session.currentNode
      const options = currentNode.options ?? {}

      // Find next node: exact match, then wildcard
      const isWildcardMatch = !options[input] && !!options["*"]
      const nextNode: USSDNode | undefined = options[input] ?? options["*"]

      if (!nextNode) {
        // Invalid input — resend current node with error
        return NextResponse.json({
          sessionId,
          response: `Invalid option.\n\n${currentNode.response}`,
          sessionActive: true,
          requiresInput: !!currentNode.isInput,
          networkName,
          sessionMetadata: {
            networkType: session.metadata.networkType,
            isRoaming: session.metadata.isRoaming,
            cellId: session.metadata.cellId,
            signalDbm: session.metadata.signalDbm,
          },
        })
      }

      // Track free-text inputs separately for $input placeholder resolution
      if (isWildcardMatch) {
        session.inputBuffer.push(input)
      }

      // Resolve goto — redirect to another root code within the same session
      let resolvedNode = nextNode
      if (nextNode.goto) {
        const target = config.codes[nextNode.goto]
        if (target) resolvedNode = target
      }

      // Advance session
      session.history.push(input)
      session.currentNode = resolvedNode

      if (resolvedNode.cdpEvent) {
        fireCDPEvent(session, resolvedNode.cdpEvent)
      }

      const sessionActive = !resolvedNode.sessionEnd
      if (!sessionActive) {
        sessions.delete(sessionId)
      }

      return NextResponse.json({
        sessionId: sessionActive ? sessionId : null,
        response: resolvedNode.response,
        sessionActive,
        requiresInput: !!resolvedNode.isInput,
        networkName,
        sessionMetadata: {
          networkType: session.metadata.networkType,
          isRoaming: session.metadata.isRoaming,
          cellId: session.metadata.cellId,
          signalDbm: session.metadata.signalDbm,
        },
      })
    }

    return NextResponse.json({ error: "Provide ussdCode (new session) or sessionId (continue)" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const existed = sessions.has(sessionId)
    sessions.delete(sessionId)

    return NextResponse.json({ success: true, deleted: existed })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
