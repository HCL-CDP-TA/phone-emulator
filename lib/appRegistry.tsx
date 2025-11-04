import { App } from "@/types/app"
import MessagesApp from "@/components/apps/MessagesApp"
import BrowserApp from "@/components/apps/BrowserApp"
import CameraApp from "@/components/apps/CameraApp"
import PhotosApp from "@/components/apps/PhotosApp"
import SettingsApp from "@/components/apps/SettingsApp"
import ClockApp from "@/components/apps/ClockApp"
import CalculatorApp from "@/components/apps/CalculatorApp"
import MapsApp from "@/components/apps/MapsApp"
import MusicApp from "@/components/apps/MusicApp"
import ContactsApp from "@/components/apps/ContactsApp"

export const appRegistry: App[] = [
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
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
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
    id: "maps",
    name: "Maps",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
      </svg>
    ),
    iconColor: "bg-emerald-500",
    component: MapsApp,
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
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5.97 4.06L14.09 6l1.41 1.41L16.91 6l1.06 1.06-1.41 1.41 1.41 1.41-1.06 1.06-1.41-1.4-1.41 1.41-1.06-1.06 1.41-1.41-1.41-1.42zM5 19.5v-2h14v2H5z" />
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
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z" />
      </svg>
    ),
    iconColor: "bg-gray-500",
    component: ContactsApp,
    category: "communication",
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
]

export function getAppById(id: string): App | undefined {
  return appRegistry.find(app => app.id === id)
}
