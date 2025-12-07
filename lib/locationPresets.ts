import { LocationPreset } from "@/types/app"

export const DEFAULT_LOCATION_PRESETS: LocationPreset[] = [
  {
    id: "sf-downtown",
    name: "San Francisco Downtown",
    description: "Static location in downtown San Francisco",
    type: "static",
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: "nyc-times-square",
    name: "Times Square, NYC",
    description: "Static location at Times Square",
    type: "static",
    latitude: 40.758,
    longitude: -73.9855,
  },
  {
    id: "london-tower",
    name: "Tower of London",
    description: "Static location at the Tower of London",
    type: "static",
    latitude: 51.5081,
    longitude: -0.0759,
  },
  {
    id: "route-sf-bridge",
    name: "SF to Golden Gate",
    description: "Route from downtown SF to Golden Gate Bridge",
    type: "route",
    waypoints: [
      { latitude: 37.7749, longitude: -122.4194 }, // Start: Downtown SF
      { latitude: 37.7849, longitude: -122.4294, speed: 10 }, // Moving north
      { latitude: 37.7949, longitude: -122.4394, speed: 10 },
      { latitude: 37.8049, longitude: -122.4494, speed: 10 },
      { latitude: 37.8199, longitude: -122.4783 }, // End: Golden Gate Bridge
    ],
  },
  {
    id: "route-nyc-central-park",
    name: "NYC to Central Park",
    description: "Route from Times Square to Central Park",
    type: "route",
    waypoints: [
      { latitude: 40.758, longitude: -73.9855 }, // Start: Times Square
      { latitude: 40.768, longitude: -73.9815, speed: 8 },
      { latitude: 40.778, longitude: -73.9732, speed: 8 },
      { latitude: 40.785, longitude: -73.9682 }, // End: Central Park
    ],
  },
]
