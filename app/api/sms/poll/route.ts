import { NextResponse } from "next/server"

// NOTE: This polling endpoint is DEPRECATED as of the SSE implementation.
// The client now uses Server-Sent Events (/api/sms/stream) for real-time delivery.
// This endpoint is kept as a backup/fallback mechanism only.
// The queueMessage() function is still used when SSE delivery fails (no active connections).

// In-memory message queue (in production, use Redis or a database)
// Structure: { phoneNumber: [{ sender, message, timestamp }, ...] }
const messageQueues = new Map<string, Array<{ sender: string; message: string; timestamp: number }>>()

// Cleanup old messages (older than 5 minutes)
function cleanupOldMessages() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [phoneNumber, messages] of messageQueues.entries()) {
    const filtered = messages.filter(msg => msg.timestamp > fiveMinutesAgo)
    if (filtered.length === 0) {
      messageQueues.delete(phoneNumber)
    } else {
      messageQueues.set(phoneNumber, filtered)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupOldMessages, 60 * 1000)

// DEPRECATED: Client no longer uses polling. Kept for backward compatibility.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get("phoneNumber")
    const since = searchParams.get("since")

    if (!phoneNumber) {
      return NextResponse.json({ error: "Missing phoneNumber parameter" }, { status: 400 })
    }

    const sinceTimestamp = since ? parseInt(since) : 0
    const messages = messageQueues.get(phoneNumber) || []

    // Return only messages newer than 'since'
    const newMessages = messages.filter(msg => msg.timestamp > sinceTimestamp)

    return NextResponse.json({
      success: true,
      phoneNumber,
      messages: newMessages,
      count: newMessages.length,
    })
  } catch (error) {
    console.error("Error polling for SMS:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to add message to queue (called from main SMS API as fallback when SSE fails)
// This is still active and used when no SSE connections are available for a phone number
export function queueMessage(phoneNumber: string, sender: string, message: string) {
  console.log(`[Queue] Queueing message for ${phoneNumber} (SSE delivery failed)`)

  if (!messageQueues.has(phoneNumber)) {
    messageQueues.set(phoneNumber, [])
  }

  const queue = messageQueues.get(phoneNumber)!
  queue.push({
    sender,
    message,
    timestamp: Date.now(),
  })

  // Keep only last 50 messages per phone number
  if (queue.length > 50) {
    queue.shift()
  }
}
