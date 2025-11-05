"use client"

import { AppProps } from "@/types/app"
import { usePhone } from "@/contexts/PhoneContext"
import { useState, useMemo } from "react"
import { SMS } from "@/types/app"

interface Conversation {
  sender: string
  messages: SMS[]
  lastMessage: SMS
  unreadCount: number
}

// Generate initials from sender name (1-2 letters)
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Generate consistent color for each sender based on their name
function getAvatarColor(name: string): string {
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

  // Generate a hash from the name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use hash to pick a color
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Avatar component
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getAvatarColor(
        name,
      )} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

export default function MessagesApp({ onClose }: AppProps) {
  const { smsMessages, markSMSAsRead, openApp, deleteConversation } = usePhone()
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Group messages by sender
  const conversations = useMemo(() => {
    const grouped = new Map<string, SMS[]>()

    smsMessages.forEach(sms => {
      const existing = grouped.get(sms.sender) || []
      grouped.set(sms.sender, [...existing, sms])
    })

    const conversationList: Conversation[] = []
    grouped.forEach((messages, sender) => {
      const sortedMessages = messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      conversationList.push({
        sender,
        messages: sortedMessages,
        lastMessage: sortedMessages[0],
        unreadCount: sortedMessages.filter(m => !m.read).length,
      })
    })

    return conversationList.sort(
      (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime(),
    )
  }, [smsMessages])

  const handleConversationClick = (sender: string) => {
    // Mark all messages from this sender as read
    const conversation = conversations.find(c => c.sender === sender)
    if (conversation) {
      conversation.messages.forEach(msg => {
        if (!msg.read) {
          markSMSAsRead(msg.id)
        }
      })
    }
    setSelectedSender(sender)
  }

  const handleBackToList = () => {
    setSelectedSender(null)
    setShowDeleteConfirm(false)
  }

  const handleDeleteConversation = () => {
    if (selectedSender) {
      deleteConversation(selectedSender)
      setSelectedSender(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleLinkClick = (url: string) => {
    // Open the browser app with the URL
    localStorage.setItem("browserUrl", url)
    openApp("browser")
  }

  const shortenUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      // If it's already a uni.ca short URL, return as is
      if (urlObj.hostname === "uni.ca") {
        return url.replace(/^https?:\/\//, "")
      }

      // Extract domain and path
      const domain = urlObj.hostname.replace("www.", "")
      const path = urlObj.pathname + urlObj.search

      // If the full domain + path is short enough, show it
      if (domain.length + path.length <= 25) {
        return domain + path
      }

      // Otherwise, simulate a short URL
      const hash = Math.abs(
        url.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0),
      )

      const shortCode = hash.toString(36).substring(0, 6)
      return `uni.ca/${shortCode}`
    } catch {
      return url
    }
  }

  const extractLinks = (text: string): { text: string; isLink: boolean; url?: string; displayText?: string }[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts: { text: string; isLink: boolean; url?: string; displayText?: string }[] = []
    let lastIndex = 0
    let match

    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), isLink: false })
      }
      const fullUrl = match[0]
      const shortUrl = shortenUrl(fullUrl)
      parts.push({
        text: shortUrl,
        isLink: true,
        url: fullUrl,
        displayText: shortUrl,
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isLink: false })
    }

    return parts.length > 0 ? parts : [{ text, isLink: false }]
  }

  // If a conversation is selected, show the conversation view
  if (selectedSender) {
    const conversation = conversations.find(c => c.sender === selectedSender)
    if (!conversation) {
      setSelectedSender(null)
      return null
    }

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Conversation Header */}
        <div className="flex items-center gap-3 p-4 bg-gray-100 border-b">
          <button onClick={handleBackToList} className="text-blue-500 hover:text-blue-600 p-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Avatar name={conversation.sender} size="md" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{conversation.sender}</h1>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 hover:text-red-600 p-1"
            title="Delete conversation">
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
              <h2 className="text-xl font-bold mb-2">Delete Conversation?</h2>
              <p className="text-gray-600 mb-6">
                This will delete all messages from {conversation.sender}. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConversation}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Messages */}
        <div className="flex-1 overflow-y-auto p-4 pb-16 space-y-3 bg-gray-50">
          {conversation.messages
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(sms => (
              <div key={sms.id} className="flex justify-start">
                <div className="max-w-[80%] bg-gray-200 rounded-2xl rounded-tl-sm px-4 py-2">
                  <div className="text-gray-900 wrap-break-word">
                    {extractLinks(sms.message).map((part, idx) =>
                      part.isLink ? (
                        <button
                          key={idx}
                          onClick={e => {
                            e.stopPropagation()
                            handleLinkClick(part.url!)
                          }}
                          className="text-blue-600 underline hover:text-blue-800 font-medium">
                          {part.text}
                        </button>
                      ) : (
                        <span key={idx}>{part.text}</span>
                      ),
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(sms.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  // Show conversation list
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <button onClick={onClose} className="text-blue-500 hover:text-blue-600 p-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Messages</h1>
        <div className="w-6"></div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto pb-12">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <p>No messages</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map(conversation => (
              <div
                key={conversation.sender}
                onClick={() => handleConversationClick(conversation.sender)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${conversation.unreadCount > 0 ? "bg-blue-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar name={conversation.sender} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            conversation.unreadCount > 0 ? "text-blue-600" : "text-gray-900"
                          }`}>
                          {conversation.sender}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5 text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {new Date(conversation.lastMessage.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm truncate">{conversation.lastMessage.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
