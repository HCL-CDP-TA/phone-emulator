import { NextResponse } from "next/server"
import { broadcastPushToPhone } from "./stream/route"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber, appId, title, body: notifBody, imageUrl, actionButtons } = body

    // Validate required fields
    if (!phoneNumber || !appId || !title || !notifBody) {
      return NextResponse.json(
        { error: "Missing required fields: phoneNumber, appId, title, body" },
        { status: 400 },
      )
    }

    if (typeof phoneNumber !== "string" || typeof appId !== "string" || typeof title !== "string" || typeof notifBody !== "string") {
      return NextResponse.json({ error: "phoneNumber, appId, title, and body must be strings" }, { status: 400 })
    }

    if (imageUrl && typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl must be a string" }, { status: 400 })
    }

    if (actionButtons) {
      if (!Array.isArray(actionButtons)) {
        return NextResponse.json({ error: "actionButtons must be an array" }, { status: 400 })
      }
      if (actionButtons.length > 3) {
        return NextResponse.json({ error: "Maximum 3 action buttons allowed" }, { status: 400 })
      }
      for (const btn of actionButtons) {
        if (!btn.id || !btn.label || typeof btn.url !== "string") {
          return NextResponse.json(
            { error: "Each action button must have id, label, and url (string)" },
            { status: 400 },
          )
        }
      }
    }

    const pushData = {
      appId: appId.trim(),
      title: title.trim(),
      body: notifBody.trim(),
      imageUrl: imageUrl?.trim(),
      actionButtons: actionButtons as Array<{ id: string; label: string; url: string }> | undefined,
      timestamp: Date.now(),
    }

    const delivered = broadcastPushToPhone(phoneNumber, pushData)

    if (delivered) {
      return NextResponse.json(
        {
          success: true,
          message: "Push notification delivered via SSE",
          phoneNumber,
          data: pushData,
          deliveryMethod: "sse",
        },
        { status: 200 },
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "No active connection for phone number",
          phoneNumber,
          data: pushData,
          deliveryMethod: "none",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Error processing push notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
