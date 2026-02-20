import { NextResponse } from "next/server"
import { ApiClient, ApiConfiguration, ApiRequest, UserIdentity, UserIdentityType, EventType } from "@hcl-cdp-ta/cdp-node-sdk"
import { USSDSession, USSDNode, USSDCDPEvent } from "@/types/ussd"
import { getUSSDConfig } from "../config/route"

// In-memory session store
const sessions = new Map<string, USSDSession>()

// Clean up sessions older than 5 minutes
const SESSION_TIMEOUT_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions.entries()) {
    if (now - session.startedAt > SESSION_TIMEOUT_MS) {
      sessions.delete(id)
    }
  }
}, 60_000)

function generateSessionId(): string {
  return `ussd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Resolve $input, $input_prev, $input_prev2 placeholders in CDP event properties.
// These reference the inputBuffer (wildcard-matched user inputs, oldest first).
function resolveProperties(
  props: Record<string, string | number | boolean> | undefined,
  inputBuffer: string[],
): Record<string, string | number | boolean> {
  if (!props) return {}
  const resolved: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") {
      if (value === "$input" && inputBuffer.length >= 1) {
        resolved[key] = inputBuffer[inputBuffer.length - 1]
      } else if (value === "$input_prev" && inputBuffer.length >= 2) {
        resolved[key] = inputBuffer[inputBuffer.length - 2]
      } else if (value === "$input_prev2" && inputBuffer.length >= 3) {
        resolved[key] = inputBuffer[inputBuffer.length - 3]
      } else {
        resolved[key] = value
      }
    } else {
      resolved[key] = value
    }
  }
  return resolved
}

async function fireCDPEvent(phoneNumber: string, event: USSDCDPEvent, inputBuffer: string[] = []): Promise<void> {
  const apiKey = process.env.CDP_API_KEY
  const passKey = process.env.CDP_PASS_KEY

  if (!apiKey || !passKey) {
    console.log(`[USSD] CDP not configured, skipping event: "${event.eventId}"`)
    return
  }

  try {
    const config = new ApiConfiguration(apiKey, passKey)
    const client = new ApiClient(config)
    const identity = new UserIdentity(UserIdentityType.Primary, "phone", phoneNumber)
    const resolvedProps = resolveProperties(event.properties, inputBuffer)
    const request = new ApiRequest(EventType.Track, event.eventId, identity, resolvedProps)

    const response = await client.sendEvent(request)
    console.log(`[USSD] CDP event fired: "${event.eventId}" for ${phoneNumber} — ${response.response?.message ?? "ok"}`)
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
      const { phoneNumber, ussdCode } = body

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
      const session: USSDSession = {
        sessionId,
        phoneNumber,
        currentNode: rootNode,
        rootCode: ussdCode,
        history: [],
        inputBuffer: [],
        startedAt: Date.now(),
      }
      sessions.set(sessionId, session)

      if (rootNode.cdpEvent) {
        fireCDPEvent(phoneNumber, rootNode.cdpEvent, session.inputBuffer)
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
        fireCDPEvent(session.phoneNumber, resolvedNode.cdpEvent, session.inputBuffer)
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
