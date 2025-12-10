"use client"

import { usePhone } from "@/contexts/PhoneContext"
import { getAppById } from "@/lib/appRegistry"
import StatusBar from "./StatusBar"
import HomeScreen from "./HomeScreen"
import NotificationBanner from "./NotificationBanner"
import GeofenceApp from "@/components/apps/GeofenceApp"

export default function Phone() {
  const { activeApp, closeApp, addNotification, location, requestLocation } = usePhone()

  const currentApp = activeApp ? getAppById(activeApp) : null
  const AppComponent = currentApp?.component

  return (
    <div className="relative w-[430px] h-[875px] bg-black rounded-[3rem] shadow-2xl overflow-hidden border-8 border-gray-900 cursor-pointer">
      {/* Phone Screen */}
      <div className="relative w-full h-full bg-black overflow-hidden cursor-pointer">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-black/30 backdrop-blur">
          <StatusBar />
        </div>

        {/* Background Apps - always mounted but hidden */}
        <div className={`w-full h-full pt-11 ${activeApp === "geofence" ? "block" : "hidden"}`}>
          <GeofenceApp
            onClose={closeApp}
            onSendNotification={addNotification}
            location={location.position}
            locationError={location.error}
            requestLocation={requestLocation}
          />
        </div>

        {/* App Content or Home Screen */}
        <div className={`w-full h-full pt-11 ${activeApp === "geofence" ? "hidden" : "block"}`}>
          {AppComponent && activeApp !== "geofence" ? (
            <AppComponent
              onClose={closeApp}
              onSendNotification={addNotification}
              location={location.position}
              locationError={location.error}
              requestLocation={requestLocation}
            />
          ) : !activeApp ? (
            <HomeScreen />
          ) : null}
        </div>

        {/* Notification Banner */}
        <NotificationBanner />

        {/* Home Button - Always visible when in an app */}
        {activeApp && (
          <div className="absolute bottom-0 left-0 right-0 pb-4 pt-6 flex justify-center z-50 bg-linear-to-t from-black/40 to-transparent pointer-events-none">
            <button
              onClick={closeApp}
              className="w-32 h-1.5 bg-white rounded-full hover:bg-white/90 transition-colors active:scale-95 shadow-lg pointer-events-auto"
              aria-label="Home"
            />
          </div>
        )}
      </div>
    </div>
  )
}
