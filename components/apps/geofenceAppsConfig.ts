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
}

export const GEOFENCE_APPS: GeofenceAppConfig[] = [
  {
    id: "banking",
    name: "Banking",
    url: "https://banking.demo.now.hclsoftware.cloud/",
    iconName: "Banking",
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
  },
]
