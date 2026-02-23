import { NextRequest } from "next/server"

// Use globalThis to share the connections map across module instances
// (Turbopack in dev mode may create separate module instances for sibling routes)
const globalKey = "__unifiedSSEConnections"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any
if (!g[globalKey]) {
  g[globalKey] = new Map<string, Set<ReadableStreamDefaultController>>()
}
const activeConnections: Map<string, Set<ReadableStreamDefaultController>> = g[globalKey]

// Broadcast a typed event to all unified-stream connections for a phone number
export function broadcastToUnifiedStream(
  phoneNumber: string,
  type: "sms" | "email" | "whatsapp" | "push",
  data: Record<string, unknown>,
) {
  const connections = activeConnections.get(phoneNumber)
  if (!connections || connections.size === 0) return false

  const sseMessage = `data: ${JSON.stringify({ type, ...data })}\n\n`
  const dead: ReadableStreamDefaultController[] = []
  let sent = 0

  for (const controller of connections) {
    try {
      controller.enqueue(new TextEncoder().encode(sseMessage))
      sent++
    } catch {
      dead.push(controller)
    }
  }

  for (const c of dead) connections.delete(c)
  if (connections.size === 0) activeConnections.delete(phoneNumber)

  return sent > 0
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phoneNumber = searchParams.get("phoneNumber")

  if (!phoneNumber) {
    return new Response("Missing phoneNumber parameter", { status: 400 })
  }

  const { signal } = request

  const stream = new ReadableStream({
    start(controller) {
      if (!activeConnections.has(phoneNumber)) {
        activeConnections.set(phoneNumber, new Set())
      }
      activeConnections.get(phoneNumber)!.add(controller)

      // Send initial connection confirmation
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: "connected", phoneNumber })}\n\n`,
        ),
      )

      let cleaned = false
      const cleanup = () => {
        if (cleaned) return
        cleaned = true
        const conns = activeConnections.get(phoneNumber)
        if (conns) {
          conns.delete(controller)
          if (conns.size === 0) activeConnections.delete(phoneNumber)
        }
      }

      const onAbort = () => {
        clearInterval(ping)
        cleanup()
      }
      signal.addEventListener("abort", onAbort)

      const ping = setInterval(() => {
        if (cleaned) { clearInterval(ping); return }
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"))
        } catch {
          clearInterval(ping)
          cleanup()
        }
      }, 30000)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(controller as any).cleanup = () => {
        signal.removeEventListener("abort", onAbort)
        clearInterval(ping)
        cleanup()
      }
    },
    cancel(controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = (controller as any).cleanup
      if (c) c()
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
