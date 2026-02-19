import { NextRequest } from "next/server"

// Use globalThis to share the connections map across module instances
// (Turbopack in dev mode may create separate module instances for sibling routes)
const globalKey = "__pushSSEConnections"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any
if (!g[globalKey]) {
  g[globalKey] = new Map<string, Set<ReadableStreamDefaultController>>()
}
const activeConnections: Map<string, Set<ReadableStreamDefaultController>> = g[globalKey]

// Helper to broadcast push notification to all connections for a phone number
export function broadcastPushToPhone(
  phoneNumber: string,
  data: Record<string, unknown>,
) {
  const connections = activeConnections.get(phoneNumber)
  if (!connections || connections.size === 0) {
    console.log(`[Push SSE] No active connections for ${phoneNumber}`)
    return false
  }

  const sseData = JSON.stringify(data)
  const sseMessage = `data: ${sseData}\n\n`

  console.log(`[Push SSE] Broadcasting to ${connections.size} connection(s) for ${phoneNumber}`)

  let successCount = 0
  const deadConnections: ReadableStreamDefaultController[] = []

  for (const controller of connections) {
    try {
      controller.enqueue(new TextEncoder().encode(sseMessage))
      successCount++
    } catch (error) {
      console.error("[Push SSE] Failed to send to connection (dead connection):", error)
      deadConnections.push(controller)
    }
  }

  // Remove dead connections
  for (const deadController of deadConnections) {
    connections.delete(deadController)
  }

  if (connections.size === 0) {
    activeConnections.delete(phoneNumber)
  }

  console.log(`[Push SSE] Delivered to ${successCount}/${successCount + deadConnections.length} connections`)

  return successCount > 0
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phoneNumber = searchParams.get("phoneNumber")

  if (!phoneNumber) {
    return new Response("Missing phoneNumber parameter", { status: 400 })
  }

  console.log(`[Push SSE] New connection for ${phoneNumber}`)

  const { signal } = request

  const stream = new ReadableStream({
    start(controller) {
      if (!activeConnections.has(phoneNumber)) {
        activeConnections.set(phoneNumber, new Set())
      }
      activeConnections.get(phoneNumber)!.add(controller)

      console.log(
        `[Push SSE] Active connections for ${phoneNumber}: ${activeConnections.get(phoneNumber)!.size}`,
      )

      // Send initial connection success message
      const connectMessage = `data: ${JSON.stringify({ type: "connected", phoneNumber })}\n\n`
      controller.enqueue(new TextEncoder().encode(connectMessage))

      let isCleanedUp = false
      const cleanup = () => {
        if (isCleanedUp) return
        isCleanedUp = true

        const connections = activeConnections.get(phoneNumber)
        if (connections) {
          connections.delete(controller)
          console.log(`[Push SSE] Connection closed for ${phoneNumber}. Remaining: ${connections.size}`)
          if (connections.size === 0) {
            activeConnections.delete(phoneNumber)
          }
        }
      }

      const onAbort = () => {
        console.log(`[Push SSE] Client disconnected for ${phoneNumber}`)
        clearInterval(keepAliveInterval)
        cleanup()
      }
      signal.addEventListener("abort", onAbort)

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        if (isCleanedUp) {
          clearInterval(keepAliveInterval)
          return
        }
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"))
        } catch {
          clearInterval(keepAliveInterval)
          cleanup()
        }
      }, 30000)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(controller as any).cleanup = () => {
        signal.removeEventListener("abort", onAbort)
        clearInterval(keepAliveInterval)
        cleanup()
      }
    },
    cancel(controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanup = (controller as any).cleanup
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
