import { NextResponse } from "next/server"
import { broadcastWhatsAppToPhone } from "./stream/route"
import { WhatsAppButton } from "@/types/app"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sender, message, phoneNumber, senderNumber, profilePictureUrl, buttons } = body

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

    if (senderNumber && typeof senderNumber !== "string") {
      return NextResponse.json({ error: "senderNumber must be a string" }, { status: 400 })
    }

    if (profilePictureUrl && typeof profilePictureUrl !== "string") {
      return NextResponse.json({ error: "profilePictureUrl must be a string" }, { status: 400 })
    }

    if (buttons && !Array.isArray(buttons)) {
      return NextResponse.json({ error: "buttons must be an array" }, { status: 400 })
    }

    const messageData = {
      sender: sender.trim(),
      message: message.trim(),
      senderNumber: senderNumber?.trim(),
      profilePictureUrl: profilePictureUrl?.trim(),
      buttons: buttons as WhatsAppButton[] | undefined,
      timestamp: new Date().toISOString(),
    }

    // If phoneNumber provided, try SSE delivery
    if (phoneNumber) {
      const delivered = broadcastWhatsAppToPhone(
        phoneNumber,
        messageData.sender,
        messageData.message,
        messageData.senderNumber,
        messageData.profilePictureUrl,
        messageData.buttons,
      )

      if (delivered) {
        // Message delivered via SSE
        return NextResponse.json(
          {
            success: true,
            message: "WhatsApp message delivered via SSE",
            phoneNumber,
            data: messageData,
            deliveryMethod: "sse",
          },
          { status: 200 },
        )
      } else {
        // No active connection
        return NextResponse.json(
          {
            success: false,
            message: "No active connection for phone number",
            phoneNumber,
            data: messageData,
            deliveryMethod: "none",
          },
          { status: 404 },
        )
      }
    }

    // Otherwise, return success (client-side handles delivery)
    return NextResponse.json(
      {
        success: true,
        message: "WhatsApp message sent successfully",
        data: messageData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing WhatsApp message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
