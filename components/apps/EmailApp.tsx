"use client"

import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"
import { useState, useMemo } from "react"
import DOMPurify from "dompurify"

// Generate initials from email address (1-2 letters)
function getInitials(email: string): string {
  const name = email.split("@")[0]
  const words = name.split(/[._-]/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Generate consistent color for each sender based on their email
function getAvatarColor(email: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ]

  // Generate a hash from the email
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use hash to pick a color
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Avatar component
function Avatar({ email, size = "md" }: { email: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getAvatarColor(
        email,
      )} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {getInitials(email)}
    </div>
  )
}

export default function EmailApp({ onClose }: AppProps) {
  const { emailMessages, markEmailAsRead, openApp, deleteEmail } = usePhone()
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Sort emails by timestamp (newest first)
  const sortedEmails = useMemo(() => {
    return [...emailMessages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [emailMessages])

  const handleEmailClick = (emailId: string) => {
    markEmailAsRead(emailId)
    setSelectedEmailId(emailId)
  }

  const handleBackToList = () => {
    setSelectedEmailId(null)
    setShowDeleteConfirm(false)
  }

  const handleDeleteEmail = () => {
    if (selectedEmailId) {
      deleteEmail(selectedEmailId)
      setSelectedEmailId(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleEmailLinkClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    // Find closest <a> tag
    const link = target.closest("a")
    if (link) {
      e.preventDefault()
      const url = link.getAttribute("href")
      if (url && !url.startsWith("javascript:") && !url.startsWith("data:")) {
        localStorage.setItem("browserUrl", url)
        openApp("browser")
      }
    }
  }

  // Strip HTML tags for preview text
  const getPreviewText = (htmlContent: string | undefined, textContent: string): string => {
    if (!htmlContent) return textContent
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent
    const text = tempDiv.textContent || tempDiv.innerText || textContent
    return text.trim()
  }

  // If an email is selected, show the email detail view
  if (selectedEmailId) {
    const email = emailMessages.find(e => e.id === selectedEmailId)
    if (!email) {
      setSelectedEmailId(null)
      return null
    }

    // Sanitize HTML content
    const sanitizedHTML = email.htmlContent
      ? DOMPurify.sanitize(email.htmlContent, {
          ALLOWED_TAGS: [
            "p",
            "div",
            "span",
            "br",
            "strong",
            "em",
            "u",
            "s",
            "a",
            "img",
            "ul",
            "ol",
            "li",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "blockquote",
            "pre",
            "code",
          ],
          ALLOWED_ATTR: ["href", "src", "alt", "title", "style", "class"],
          ALLOW_DATA_ATTR: false,
          ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
        })
      : null

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Email Header */}
        <div className="flex items-center gap-3 p-4 bg-gray-100 border-b">
          <button onClick={handleBackToList} className="text-blue-500 hover:text-blue-600 p-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{email.subject}</h1>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 hover:text-red-600 p-1"
            title="Delete email">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm">
              <h2 className="text-xl font-bold mb-2">Delete Email?</h2>
              <p className="text-gray-600 mb-6">
                This will permanently delete this email. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEmail}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-16">
          {/* From/To/Date */}
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-start gap-3 mb-2">
              <Avatar email={email.from} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{email.fromName || email.from}</div>
                {email.fromName && <div className="text-xs text-gray-500 truncate">{email.from}</div>}
                <div className="text-xs text-gray-500">to {email.to}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(email.timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>

          {/* Email Body */}
          {sanitizedHTML ? (
            <div
              className="email-html-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
              onClick={handleEmailLinkClick}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-900">{email.textContent}</div>
          )}
        </div>
      </div>
    )
  }

  // Show email inbox list
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <button onClick={onClose} className="text-blue-500 hover:text-blue-600 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Mail</h1>
        <div className="w-6"></div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto pb-12">
        {sortedEmails.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <p>No email</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {sortedEmails.map(email => {
              const previewText = getPreviewText(email.htmlContent, email.textContent)
              return (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${!email.read ? "bg-blue-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Avatar email={email.from} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold truncate ${!email.read ? "text-blue-600" : "text-gray-900"}`}>
                          {email.fromName || email.from}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                          {new Date(email.timestamp).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className={`text-sm mb-1 truncate ${!email.read ? "font-semibold" : "text-gray-900"}`}>
                        {email.subject}
                      </div>
                      <div className="text-gray-600 text-sm truncate">{previewText}</div>
                    </div>
                    {!email.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
