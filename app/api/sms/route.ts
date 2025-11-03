import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sender, message } = body

    // Validate required fields
    if (!sender || !message) {
      return NextResponse.json({ error: "Missing required fields: sender and message" }, { status: 400 })
    }

    // Validate types
    if (typeof sender !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "sender and message must be strings" }, { status: 400 })
    }

    // The actual SMS delivery happens on the client side via BroadcastChannel
    // This endpoint just validates and triggers the event
    const smsData = {
      sender: sender.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

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
