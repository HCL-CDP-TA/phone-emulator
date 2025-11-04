import { NextResponse } from "next/server"
import { queueMessage } from "./poll/route"
import { broadcastToPhone } from "./stream/route"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sender, message, phoneNumber } = body

    // Validate required fields
    if (!sender || !message) {
      return NextResponse.json({ error: "Missing required fields: sender and message" }, { status: 400 })
    }

    // Validate types
    if (typeof sender !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "sender and message must be strings" }, { status: 400 })
    }

    if (phoneNumber && typeof phoneNumber !== "string") {
      return NextResponse.json({ error: "phoneNumber must be a string" }, { status: 400 })
    }

    const smsData = {
      sender: sender.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    // If phoneNumber provided, try SSE first, fallback to queue
    if (phoneNumber) {
      const delivered = broadcastToPhone(phoneNumber, smsData.sender, smsData.message)

      if (delivered) {
        // Message delivered via SSE
        return NextResponse.json(
          {
            success: true,
            message: "SMS delivered via SSE",
            phoneNumber,
            data: smsData,
            deliveryMethod: "sse",
          },
          { status: 200 },
        )
      } else {
        // No active connection, queue for polling fallback
        queueMessage(phoneNumber, smsData.sender, smsData.message)
        return NextResponse.json(
          {
            success: true,
            message: "SMS queued for delivery (no active connection)",
            phoneNumber,
            data: smsData,
            deliveryMethod: "queue",
          },
          { status: 200 },
        )
      }
    }

    // Otherwise, return success (client-side BroadcastChannel handles delivery)
    return NextResponse.json(
      {
        success: true,
        message: "SMS sent successfully",
        data: smsData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing SMS:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
