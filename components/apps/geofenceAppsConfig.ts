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
        enabled: true,
      },
      exit: {
        enabled: true,
      },
    },
    geotrackingEnabled: true,
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
        enabled: true,
      },
      exit: {
        enabled: true,
      },
    },
    geotrackingEnabled: true,
    visible: true,
  },
  {
    id: "costco",
    name: "Costco",
    url: "https://www.costco.com/",
    iconName: "Costco",
    iconColor: "bg-red-600",
    userIdMode: "manual",
    notifications: {
      enter: {
        enabled: true,
      },
      exit: {
        enabled: false,
      },
    },
    geotrackingEnabled: true,
    visible: true,
  },
]
