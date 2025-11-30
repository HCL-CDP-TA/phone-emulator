import { NextRequest } from "next/server"
import { WhatsAppButton } from "@/types/app"

// Track active connections per phone number
// Structure: { phoneNumber: Set<ReadableStreamDefaultController> }
const activeConnections = new Map<string, Set<ReadableStreamDefaultController>>()

// Helper to broadcast WhatsApp message to all connections for a phone number
export function broadcastWhatsAppToPhone(
  phoneNumber: string,
  sender: string,
  message: string,
  senderNumber?: string,
  profilePictureUrl?: string,
  buttons?: WhatsAppButton[],
) {
  const connections = activeConnections.get(phoneNumber)
  if (!connections || connections.size === 0) {
    console.log(`[WhatsApp SSE] No active connections for ${phoneNumber}`)
    return false
  }

  const data = JSON.stringify({
    sender,
    message,
    senderNumber,
    profilePictureUrl,
    buttons,
    timestamp: Date.now(),
  })
  const sseMessage = `data: ${data}\n\n`

  console.log(`[WhatsApp SSE] Broadcasting to ${connections.size} connection(s) for ${phoneNumber}`)

  // Send to all connected clients for this phone number
  let successCount = 0
  const deadConnections: ReadableStreamDefaultController[] = []

  for (const controller of connections) {
    try {
      controller.enqueue(new TextEncoder().encode(sseMessage))
      successCount++
    } catch (error) {
      console.error("[WhatsApp SSE] Failed to send to connection (dead connection):", error)
      deadConnections.push(controller)
    }
  }

  // Remove dead connections
  for (const deadController of deadConnections) {
    connections.delete(deadController)
  }

  // Clean up empty phone number entries
  if (connections.size === 0) {
    activeConnections.delete(phoneNumber)
  }

  console.log(`[WhatsApp SSE] Delivered to ${successCount}/${successCount + deadConnections.length} connections`)

  return successCount > 0
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phoneNumber = searchParams.get("phoneNumber")

  if (!phoneNumber) {
    return new Response("Missing phoneNumber parameter", { status: 400 })
  }

  console.log(`[WhatsApp SSE] New connection for ${phoneNumber}`)

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the active connections map
      if (!activeConnections.has(phoneNumber)) {
        activeConnections.set(phoneNumber, new Set())
      }
      activeConnections.get(phoneNumber)!.add(controller)

      console.log(
        `[WhatsApp SSE] Active connections for ${phoneNumber}: ${activeConnections.get(phoneNumber)!.size}`,
      )

      // Send initial connection success message
      const connectMessage = `data: ${JSON.stringify({ type: "connected", phoneNumber })}\n\n`
      controller.enqueue(new TextEncoder().encode(connectMessage))

      // Cleanup when connection closes
      const cleanup = () => {
        const connections = activeConnections.get(phoneNumber)
        if (connections) {
          connections.delete(controller)
          if (connections.size === 0) {
            activeConnections.delete(phoneNumber)
          }
          console.log(`[WhatsApp SSE] Connection closed for ${phoneNumber}. Remaining: ${connections.size}`)
        }
      }

      // Keep-alive ping every 5 seconds to quickly detect dead connections
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"))
        } catch {
          console.log("[WhatsApp SSE] Keep-alive failed, connection closed")
          clearInterval(keepAliveInterval)
          cleanup()
        }
      }, 5000)

      // Store cleanup function and interval for later
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(controller as any).cleanup = () => {
        clearInterval(keepAliveInterval)
        cleanup()
      }
    },
    cancel(controller) {
      // Called when client disconnects
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
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  })
}
