import { GeofenceZone } from "@/types/app"

export const DEFAULT_GEOFENCE_PRESETS: GeofenceZone[] = [
  {
    id: "sf-downtown-zone",
    name: "SF Downtown Zone",
    description: "500m radius around downtown San Francisco",
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 500,
  },
  {
    id: "golden-gate-zone",
    name: "Golden Gate Bridge Zone",
    description: "300m radius around Golden Gate Bridge",
    latitude: 37.8199,
    longitude: -122.4783,
    radiusMeters: 300,
  },
  {
    id: "times-square-zone",
    name: "Times Square Zone",
    description: "400m radius around Times Square",
    latitude: 40.758,
    longitude: -73.9855,
    radiusMeters: 400,
  },
]
