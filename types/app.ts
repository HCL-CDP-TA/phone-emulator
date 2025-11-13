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
  location?: GeolocationPosition | null
  locationError?: GeolocationPositionError | null
  requestLocation?: () => void
}

export interface LocationState {
  position: GeolocationPosition | null
  error: GeolocationPositionError | null
  isLoading: boolean
  hasPermission: boolean | null
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

export interface Email {
  id: string
  from: string
  fromName?: string
  to: string
  subject: string
  htmlContent?: string
  textContent: string
  timestamp: Date
  read: boolean
}
