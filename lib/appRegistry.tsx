import { App } from "@/types/app"
import DialerApp from "@/components/apps/DialerApp"
import MessagesApp from "@/components/apps/MessagesApp"
import WhatsAppApp from "@/components/apps/WhatsAppApp"
import EmailApp from "@/components/apps/EmailApp"
import BrowserApp from "@/components/apps/BrowserApp"
import CameraApp from "@/components/apps/CameraApp"
import PhotosApp from "@/components/apps/PhotosApp"
import SettingsApp from "@/components/apps/SettingsApp"
import ClockApp from "@/components/apps/ClockApp"
import CalculatorApp from "@/components/apps/CalculatorApp"
import MapsApp from "@/components/apps/MapsApp"
import GeofenceApp from "@/components/apps/GeofenceApp"
import MusicApp from "@/components/apps/MusicApp"
import ContactsApp from "@/components/apps/ContactsApp"
import SocialWebviewApp from "@/components/apps/SocialWebviewApp"
import { SOCIAL_APPS } from "@/components/apps/socialAppsConfig"
import { socialIcons } from "@/components/apps/socialIcons"
import { SHORTCUT_APPS } from "@/components/apps/shortcutAppsConfig"
import { shortcutIcons } from "@/components/apps/shortcutIcons"
import { GeofenceAppConfig } from "@/components/apps/geofenceAppsConfig"
import { geofenceAppIcons } from "@/components/apps/geofenceAppIcons"
import { geofenceIconPresets } from "@/components/apps/geofenceIconPresets"
import GeofenceWebviewApp from "@/components/apps/GeofenceWebviewApp"
import { useGeofenceApps } from "@/contexts/GeofenceAppsContext"
import { useMemo } from "react"
// import { usePhone } from "@/contexts/PhoneContext"

// Helper to generate social app component with dynamic URL
function makeSocialAppComponent(
  path: string,
  appName: string,
  icon: React.ReactNode,
): React.ComponentType<import("@/types/app").AppProps> {
  // Return a component that grabs phone number from context
  return function SocialAppWrapper(props: import("@/types/app").AppProps) {
    // Use context to get phone number (if available)
    const phoneNumber =
      typeof window !== "undefined" && window.localStorage ? localStorage.getItem("phone-number") || "" : ""
    const key = process.env.NEXT_PUBLIC_SOCIAL_APP_KEY || process.env.SOCIAL_APP_KEY || "changeme"
    const baseUrl = process.env.NEXT_PUBLIC_SOCIAL_APP_BASE_URL || "https://social.demo.now.hclsoftware.cloud"
    const url = `${baseUrl}/${path}?demo_key=${encodeURIComponent(key)}&user=${encodeURIComponent(phoneNumber)}`
    return <SocialWebviewApp url={url} appName={appName} icon={icon} {...props} />
  }
}

// Helper to generate shortcut app component with static URL
function makeShortcutAppComponent(
  url: string,
  appName: string,
  icon: React.ReactNode,
): React.ComponentType<import("@/types/app").AppProps> {
  return function ShortcutAppWrapper(props: import("@/types/app").AppProps) {
    return <SocialWebviewApp url={url} appName={appName} icon={icon} {...props} />
  }
}

// Helper to generate geofence-enabled webview app component
function makeGeofenceAppComponent(
  appId: string,
  icon: React.ReactNode,
): React.ComponentType<import("@/types/app").AppProps> {
  return function GeofenceAppWrapper(props: import("@/types/app").AppProps) {
    return <GeofenceWebviewApp appId={appId} icon={icon} {...props} />
  }
}

export const appRegistry: App[] = [
  {
    id: "dialer",
    name: "Phone",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    ),
    iconColor: "bg-green-500",
    component: DialerApp,
    category: "communication",
  },
  {
    id: "messages",
    name: "Messages",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
    iconColor: "bg-green-500",
    component: MessagesApp,
    category: "communication",
    canSendNotifications: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
    iconColor: "bg-[#25D366]",
    component: WhatsAppApp,
    category: "communication",
    canSendNotifications: true,
  },
  {
    id: "email",
    name: "Mail",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
    iconColor: "bg-blue-500",
    component: EmailApp,
    category: "communication",
    canSendNotifications: true,
  },
  // Social apps (Facebook, Instagram, X, LinkedIn, TikTok)
  ...SOCIAL_APPS.map(app => ({
    id: app.id,
    name: app.name,
    icon: socialIcons[app.iconName as keyof typeof socialIcons],
    iconColor: app.iconColor,
    component: makeSocialAppComponent(app.path, app.name, socialIcons[app.iconName as keyof typeof socialIcons]),
    category: "media" as const,
  })),
  // Website shortcuts
  ...SHORTCUT_APPS.map(app => ({
    id: app.id,
    name: app.name,
    icon: shortcutIcons[app.iconName as keyof typeof shortcutIcons],
    iconColor: app.iconColor,
    component: makeShortcutAppComponent(app.url, app.name, shortcutIcons[app.iconName as keyof typeof shortcutIcons]),
    category: "utility" as const,
  })),
  {
    id: "browser",
    name: "Chrome",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="48" width="48">
        <defs>
          <linearGradient id="a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#d93025" />
            <stop offset="1" stopColor="#ea4335" />
          </linearGradient>
          <linearGradient id="b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fcc934" />
            <stop offset="1" stopColor="#fbbc04" />
          </linearGradient>
          <linearGradient id="c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1e8e3e" />
            <stop offset="1" stopColor="#34a853" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="23.9947" r="12" style={{ fill: "#fff" }} />
        <path
          d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z"
          style={{ fill: "none" }}
        />
        <path
          d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z"
          style={{ fill: "url(#a)" }}
        />
        <circle cx="24" cy="24" r="9.5" style={{ fill: "#1a73e8" }} />
        <path
          d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z"
          style={{ fill: "url(#b)" }}
        />
        <path
          d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z"
          style={{ fill: "url(#c)" }}
        />
      </svg>
    ),
    iconColor: "bg-white",
    component: BrowserApp,
    category: "utility",
  },
  {
    id: "geofence",
    name: "Geofence",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        <circle cx="12" cy="9" r="1.5" fill="white" />
      </svg>
    ),
    iconColor: "bg-purple-500",
    component: GeofenceApp,
    category: "utility",
  },
  {
    id: "settings",
    name: "Settings",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
    iconColor: "bg-gray-400",
    component: SettingsApp,
    category: "system",
  },
  {
    id: "maps",
    name: "Maps",
    icon: (
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    iconColor: "bg-emerald-500",
    component: MapsApp,
    category: "utility",
  },

  {
    id: "camera",
    name: "Camera",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 15.2c-2.03 0-3.7-1.67-3.7-3.7s1.67-3.7 3.7-3.7 3.7 1.67 3.7 3.7-1.67 3.7-3.7 3.7zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z" />
      </svg>
    ),
    iconColor: "bg-gray-600",
    component: CameraApp,
    category: "media",
  },
  {
    id: "photos",
    name: "Photos",
    icon: (
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    iconColor: "bg-gradient-to-br from-yellow-400 to-pink-500",
    component: PhotosApp,
    category: "media",
  },
  {
    id: "clock",
    name: "Clock",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
      </svg>
    ),
    iconColor: "bg-orange-500",
    component: ClockApp,
    category: "utility",
  },

  {
    id: "music",
    name: "Music",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
    iconColor: "bg-pink-500",
    component: MusicApp,
    category: "media",
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: (
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <line x1="8" x2="16" y1="6" y2="6" />
        <line x1="16" x2="16" y1="14" y2="18" />
        <path d="M16 10h.01" />
        <path d="M12 10h.01" />
        <path d="M8 10h.01" />
        <path d="M12 14h.01" />
        <path d="M8 14h.01" />
        <path d="M12 18h.01" />
        <path d="M8 18h.01" />
      </svg>
    ),
    iconColor: "bg-slate-700",
    component: CalculatorApp,
    category: "utility",
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M16 3.128a4 4 0 0 1 0 7.744" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
    iconColor: "bg-gray-500",
    component: ContactsApp,
    category: "communication",
  },
]

// Hook to get dynamic app registry including geofence apps from context
export function useAppRegistry(): App[] {
  const { apps: geofenceApps } = useGeofenceApps()

  return useMemo(() => {
    // Filter only visible geofence apps
    const visibleGeofenceApps = geofenceApps.filter(app => app.visible)

    // Map geofence apps to registry format
    const dynamicGeofenceApps: App[] = visibleGeofenceApps.map(app => {
      // Get icon from presets or fallback to legacy icons
      const icon =
        geofenceIconPresets[app.iconName as keyof typeof geofenceIconPresets] ||
        geofenceAppIcons[app.iconName as keyof typeof geofenceAppIcons] ||
        geofenceIconPresets.Store

      return {
        id: app.id,
        name: app.name,
        icon,
        iconColor: app.iconColor,
        component: makeGeofenceAppComponent(app.id, icon),
        category: "utility" as const,
        canSendNotifications: true,
      }
    })

    // Insert geofence apps before browser app (after shortcuts)
    const browserIndex = appRegistry.findIndex(app => app.id === "browser")
    const beforeBrowser = appRegistry.slice(0, browserIndex)
    const afterBrowser = appRegistry.slice(browserIndex)

    return [...beforeBrowser, ...dynamicGeofenceApps, ...afterBrowser]
  }, [geofenceApps])
}

export function getAppById(id: string): App | undefined {
  return appRegistry.find(app => app.id === id)
}
