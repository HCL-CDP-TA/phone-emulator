import { ReactNode } from "react"

export interface App {
  id: string
  name: string
  icon: ReactNode
  iconColor: string
  component: React.ComponentType<AppProps>
  category: "system" | "communication" | "media" | "utility" | "productivity"
  canSendNotifications?: boolean
}

export interface AppProps {
  onClose: () => void
  onSendNotification?: (notification: Notification) => void
}

export interface Notification {
  id: string
  appId: string
  appName: string
  title: string
  message: string
  timestamp: Date
  icon?: ReactNode
  data?: Record<string, unknown>
  onClick?: () => void
}

export interface SMS {
  id: string
  sender: string
  message: string
  timestamp: Date
  read: boolean
}
