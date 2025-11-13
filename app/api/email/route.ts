import { NextResponse } from "next/server"
import { broadcastEmailToPhone } from "./stream/route"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { from, fromName, to, subject, htmlContent, textContent, phoneNumber } = body

    // Validate required fields
    if (!from || !subject) {
      return NextResponse.json({ error: "Missing required fields: from and subject" }, { status: 400 })
    }

    // Validate types
    if (typeof from !== "string" || typeof subject !== "string") {
      return NextResponse.json({ error: "from and subject must be strings" }, { status: 400 })
    }

    if (fromName && typeof fromName !== "string") {
      return NextResponse.json({ error: "fromName must be a string" }, { status: 400 })
    }

    if (htmlContent && typeof htmlContent !== "string") {
      return NextResponse.json({ error: "htmlContent must be a string" }, { status: 400 })
    }

    if (textContent && typeof textContent !== "string") {
      return NextResponse.json({ error: "textContent must be a string" }, { status: 400 })
    }

    if (phoneNumber && typeof phoneNumber !== "string") {
      return NextResponse.json({ error: "phoneNumber must be a string" }, { status: 400 })
    }

    const emailData = {
      from: from.trim(),
      fromName: fromName?.trim(),
      to: to?.trim() || phoneNumber || "user@phone.local",
      subject: subject.trim(),
      htmlContent: htmlContent?.trim(),
      textContent: textContent?.trim() || subject.trim(),
      timestamp: new Date().toISOString(),
    }

    // If phoneNumber provided, try SSE delivery
    if (phoneNumber) {
      const delivered = broadcastEmailToPhone(
        phoneNumber,
        emailData.from,
        emailData.fromName,
        emailData.to,
        emailData.subject,
        emailData.htmlContent,
        emailData.textContent,
      )

      if (delivered) {
        // Message delivered via SSE
        return NextResponse.json(
          {
            success: true,
            message: "Email delivered via SSE",
            phoneNumber,
            data: emailData,
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
            data: emailData,
            deliveryMethod: "none",
          },
          { status: 404 },
        )
      }
    }

    // Otherwise, return success (client-side BroadcastChannel handles delivery)
    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        data: emailData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
