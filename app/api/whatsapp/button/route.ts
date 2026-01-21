import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messageId, buttonId, buttonText, buttonType, buttonUrl, sender, senderNumber, payload } = body

    // DEBUG: Log raw body to see what's actually received
    console.log("[WhatsApp Button] Raw request body:", JSON.stringify(body, null, 2))
    console.log("[WhatsApp Button] buttonUrl value:", buttonUrl)
    console.log("[WhatsApp Button] buttonUrl type:", typeof buttonUrl)

    // Validate required fields
    if (!messageId || !buttonId || !buttonText) {
      return NextResponse.json(
        { error: "Missing required fields: messageId, buttonId, and buttonText" },
        { status: 400 },
      )
    }

    // Log the button click for analytics/workflow triggers
    console.log("[WhatsApp Button] Button clicked:", {
      messageId,
      buttonId,
      buttonText,
      buttonType,
      buttonUrl,
      sender,
      senderNumber,
      payload,
      timestamp: new Date().toISOString(),
    })

    // Forward button click to TA Demo API
    const taApiUrl = process.env.TA_DEMO_API_URL || "http://localhost:3001"
    let webhookUrl = `${taApiUrl}/api/whatsapp/button-response`

    // Extract query parameters from buttonUrl and append to webhook URL
    if (buttonUrl) {
      try {
        const url = new URL(buttonUrl)
        const params = url.searchParams
        if (params.toString()) {
          webhookUrl += `?${params.toString()}`
        }
      } catch (error) {
        console.warn("[WhatsApp Button] Failed to parse buttonUrl:", buttonUrl, error)
      }
    }

    try {
      console.log("[WhatsApp Button] Forwarding button click to:", webhookUrl)
      console.log(
        "[WhatsApp Button] Request body:",
        JSON.stringify({
          messageId,
          buttonId,
          buttonText,
          buttonType,
          buttonUrl,
          sender,
          senderNumber,
          payload,
        }),
      )

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          buttonId,
          buttonText,
          buttonType,
          buttonUrl,
          sender,
          senderNumber,
          payload,
        }),
      })

      if (!webhookResponse.ok) {
        console.error(`[WhatsApp Button] TA Demo API responded with ${webhookResponse.status}`)
      } else {
        console.log(`[WhatsApp Button] Successfully forwarded to TA Demo API`)
      }
    } catch (webhookError) {
      console.error("[WhatsApp Button] Failed to forward to TA Demo API:", webhookError)
      // Don't fail the entire request if webhook fails - just log it
    }

    return NextResponse.json(
      {
        success: true,
        message: "Button click recorded",
        data: {
          messageId,
          buttonId,
          buttonText,
          buttonType,
          buttonUrl,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing button click:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
