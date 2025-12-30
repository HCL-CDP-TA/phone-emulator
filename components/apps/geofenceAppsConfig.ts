export interface GeofenceAppConfig {
  id: string
  name: string
  url: string
  iconName: string
  iconColor: string
  userIdMode: "postmessage" | "manual"
  notifications: {
    enter: {
      enabled: boolean
    }
    exit: {
      enabled: boolean
    }
  }
  geotrackingEnabled: boolean
  visible: boolean
}

export const GEOFENCE_APPS: GeofenceAppConfig[] = [
  {
    id: "banking",
    name: "UniBank",
    url: "https://banking.demo.now.hclsoftware.cloud/",
    iconName: "Banking",
    iconColor: "bg-green-700",
    userIdMode: "postmessage",
    notifications: {
      enter: {
        enabled: false,
      },
      exit: {
        enabled: false,
      },
    },
    geotrackingEnabled: false,
    visible: true,
  },
  {
    id: "telco",
    name: "UniTel",
    url: "https://telco.demo.now.hclsoftware.cloud/",
    iconName: "Telco",
    iconColor: "bg-blue-700",
    userIdMode: "postmessage",
    notifications: {
      enter: {
        enabled: false,
      },
      exit: {
        enabled: false,
      },
    },
    geotrackingEnabled: false,
    visible: true,
  },
  {
    id: "maison",
    name: "Maison",
    url: "https://maison.demo.now.hclsoftware.cloud/",
    iconName: "Maison",
    iconColor: "bg-gray-600",
    userIdMode: "postmessage",
    notifications: {
      enter: {
        enabled: false,
      },
      exit: {
        enabled: false,
      },
    },
    geotrackingEnabled: false,
    visible: true,
  },
]
