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
  onSendNotification?: (notification: Omit<Notification, "id" | "timestamp">) => void
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
  iconColor?: string
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

export interface WhatsAppButton {
  id: string
  text: string
  type?: "quick_reply" | "url" | "phone" | "custom"
  url?: string
  phoneNumber?: string
  payload?: Record<string, unknown>
}

export interface WhatsAppMessage {
  id: string
  sender: string
  senderNumber?: string
  profilePictureUrl?: string
  message: string
  timestamp: Date
  read: boolean
  buttons?: WhatsAppButton[]
}

export interface LocationOverride {
  enabled: boolean
  mode: "static" | "route"
  staticPosition?: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number | null
    altitudeAccuracy?: number | null
    heading?: number | null
    speed?: number | null
  }
  route?: {
    id: string
    name: string
    waypoints: Array<{
      latitude: number
      longitude: number
      speed?: number
    }>
    currentWaypointIndex: number
    progress: number
    isPlaying: boolean
    loop: boolean
  }
}

export interface LocationPreset {
  id: string
  name: string
  description?: string
  type: "static" | "route"
  latitude?: number
  longitude?: number
  waypoints?: Array<{
    latitude: number
    longitude: number
    speed?: number
  }>
}

export interface GeofenceAppOverrides {
  [appId: string]: {
    geotrackingEnabled?: boolean
    notifications?: {
      enter?: { enabled: boolean }
      exit?: { enabled: boolean }
    }
  }
}
