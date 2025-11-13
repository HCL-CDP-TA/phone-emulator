"use client"

import { useState, useEffect } from "react"

export default function EmailTesterPage() {
  const [from, setFrom] = useState("marketing@acmecorp.com")
  const [fromName, setFromName] = useState("Acme Marketing")
  const [subject, setSubject] = useState("Special Offer - 50% Off Today!")
  const [htmlContent, setHtmlContent] = useState(`<h1>Hello!</h1>
<p>We're excited to offer you an exclusive <strong>50% discount</strong> on all products!</p>
<p>Check out our <a href="https://example.com/deals">amazing deals</a> today.</p>
<ul>
  <li>Free shipping on all orders</li>
  <li>30-day money-back guarantee</li>
  <li>24/7 customer support</li>
</ul>
<p>Don't miss out on this limited-time offer!</p>`)
  const [phoneNumber, setPhoneNumber] = useState("+12345678901")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load phone number from localStorage on mount (same as SMS tester)
  useEffect(() => {
    const storedPhoneNumber = localStorage.getItem("phone-number")
    if (storedPhoneNumber && storedPhoneNumber !== "skip") {
      setPhoneNumber(storedPhoneNumber)
    }
  }, [])

  // Strip HTML tags for text content
  const stripHtml = (html: string): string => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  const handleSendEmail = async () => {
    if (!from || !subject) {
      setStatus("❌ Please enter 'from' and 'subject' fields")
      return
    }

    setIsLoading(true)
    setStatus("📧 Sending email...")

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          from,
          fromName,
          subject,
          htmlContent: htmlContent.trim(),
          textContent: stripHtml(htmlContent),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.deliveryMethod === "sse") {
          setStatus("✅ Email delivered via SSE!")
        } else {
          setStatus("✅ Email sent successfully!")
        }
      } else {
        // Handle 404 specifically for no active connection
        if (response.status === 404 && data.deliveryMethod === "none") {
          setStatus(`⚠️ Phone not connected: No active SSE connection for ${phoneNumber}. Make sure the phone is logged in with this number.`)
        } else {
          setStatus(`❌ Error: ${data.error || data.message || "Failed to send email"}`)
        }
      }
    } catch (error) {
      console.error("Error sending email:", error)
      setStatus("❌ Network error - could not send email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadExample = (exampleType: string) => {
    switch (exampleType) {
      case "promotional":
        setFrom("promo@shop.com")
        setFromName("Flash Sale Team")
        setSubject("🎉 Flash Sale - 70% Off Everything!")
        setHtmlContent(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #e63946;">Flash Sale Alert! 🔥</h1>
  <p>For the next <strong>24 hours only</strong>, enjoy 70% off everything in our store!</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://example.com/flash-sale" 
       style="background-color: #e63946; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Shop Now
    </a>
  </p>
  <p>This offer expires in 24 hours. Don't miss out!</p>
</div>`)
        break
      case "newsletter":
        setFrom("newsletter@techblog.com")
        setFromName("TechBlog Weekly")
        setSubject("Weekly Tech Digest - Top Stories")
        setHtmlContent(`<div style="font-family: Georgia, serif; color: #333;">
  <h2 style="border-bottom: 2px solid #1d3557; padding-bottom: 10px;">This Week in Tech</h2>
  
  <h3>🚀 Top Story</h3>
  <p>New breakthrough in quantum computing promises 1000x faster processing.</p>
  <p><a href="https://techblog.com/quantum">Read more →</a></p>
  
  <h3>💡 Trending</h3>
  <ul>
    <li><a href="https://techblog.com/ai">AI startups raise record funding</a></li>
    <li><a href="https://techblog.com/mobile">The future of mobile devices</a></li>
    <li><a href="https://techblog.com/security">Cybersecurity best practices 2025</a></li>
  </ul>
  
  <p style="color: #666; font-size: 12px; margin-top: 30px;">
    You're receiving this because you subscribed to TechBlog Weekly.
  </p>
</div>`)
        break
      case "transactional":
        setFrom("orders@store.com")
        setFromName("Order Fulfillment")
        setSubject("Your Order #12345 Has Shipped")
        setHtmlContent(`<div style="font-family: Arial, sans-serif;">
  <h2>📦 Your Order is On Its Way!</h2>
  <p>Great news! Your order <strong>#12345</strong> has shipped and is on its way to you.</p>
  
  <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Tracking Number:</strong> 1Z999AA10123456784</p>
    <p style="margin: 5px 0;"><strong>Carrier:</strong> UPS</p>
    <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> Dec 15, 2025</p>
  </div>
  
  <p><a href="https://example.com/track/1Z999AA10123456784">Track Your Package →</a></p>
  
  <p>If you have any questions, feel free to contact our support team.</p>
</div>`)
        break
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Tester</h1>
              <p className="text-gray-600 text-sm">Send test emails to the phone emulator</p>
            </div>
          </div>

          {/* Example Templates */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleLoadExample("promotional")}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium">
                🎁 Promotional
              </button>
              <button
                onClick={() => handleLoadExample("newsletter")}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium">
                📰 Newsletter
              </button>
              <button
                onClick={() => handleLoadExample("transactional")}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium">
                📦 Transactional
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+12345678901"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Phone number logged into the emulator</p>
            </div>

            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                From (Sender Email)
              </label>
              <input
                id="from"
                type="email"
                value={from}
                onChange={e => setFrom(e.target.value)}
                placeholder="sender@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 mb-1">
                From Name (Display Name)
              </label>
              <input
                id="fromName"
                type="text"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Acme Marketing"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Display name shown instead of email address</p>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Your email subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="htmlContent" className="block text-sm font-medium text-gray-700 mb-1">
                HTML Content
              </label>
              <textarea
                id="htmlContent"
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                HTML will be sanitized before display. Links will open in browser app.
              </p>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendEmail}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Email
                </>
              )}
            </button>

            {/* Status Message */}
            {status && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  status.startsWith("✅")
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : status.startsWith("❌")
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : status.startsWith("⚠️")
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}>
                {status}
              </div>
            )}
          </div>

          {/* API Documentation */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">API Documentation</h2>
            <p className="text-sm text-gray-600 mb-3">
              Send emails via API from external systems (marketing automation platforms):
            </p>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Remote delivery (from marketing platforms):</p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <div className="text-green-400">POST</div>
                <div className="mt-2">/api/email</div>
                <div className="mt-2 text-gray-400">{"{"}</div>
                <div className="ml-4">
                  <span className="text-blue-400">&quot;phoneNumber&quot;</span>:{" "}
                  <span className="text-yellow-400">&quot;+12345678901&quot;</span>,
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">&quot;from&quot;</span>:{" "}
                  <span className="text-yellow-400">&quot;marketing@company.com&quot;</span>,
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">&quot;fromName&quot;</span>:{" "}
                  <span className="text-yellow-400">&quot;Marketing Team&quot;</span>,{" "}
                  <span className="text-gray-500 italic">optional</span>
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">&quot;subject&quot;</span>:{" "}
                  <span className="text-yellow-400">&quot;Your Email Subject&quot;</span>,
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">&quot;htmlContent&quot;</span>:{" "}
                  <span className="text-yellow-400">&quot;&lt;h1&gt;Hello!&lt;/h1&gt;&lt;p&gt;...&lt;/p&gt;&quot;</span>
                  , <span className="text-gray-500 italic">optional</span>
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">&quot;textContent&quot;</span>:{" "}
                  <span className="text-yellow-400">&quot;Plain text version...&quot;</span>{" "}
                  <span className="text-gray-500 italic">optional</span>
                </div>
                <div className="text-gray-400">{"}"}</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 The phone must be logged in with the specified phone number to receive the email.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              How it Works
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 ml-7">
              <li>• Emails are delivered via Server-Sent Events (SSE) for instant delivery</li>
              <li>• HTML content is automatically sanitized for security</li>
              <li>• Links in emails will open in the phone&apos;s browser app</li>
              <li>• Phone must be logged in with matching phone number to receive emails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
