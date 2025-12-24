export interface ValidateResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface LocationPresetPayload {
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

export function validateLocationPreset(payload: unknown): ValidateResult<LocationPresetPayload> {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Invalid payload" }
  }

  const data = payload as Record<string, unknown>

  // Validate name
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    return { success: false, error: "Name is required" }
  }

  if (data.name.length > 100) {
    return { success: false, error: "Name must be 100 characters or less" }
  }

  // Validate description (optional)
  if (data.description !== undefined && typeof data.description !== "string") {
    return { success: false, error: "Description must be a string" }
  }

  if (data.description && (data.description as string).length > 500) {
    return { success: false, error: "Description must be 500 characters or less" }
  }

  // Validate type
  if (data.type !== "static" && data.type !== "route") {
    return { success: false, error: 'Type must be "static" or "route"' }
  }

  // Type-specific validation
  if (data.type === "static") {
    // Static locations require latitude and longitude
    if (typeof data.latitude !== "number") {
      return { success: false, error: "Static locations require a latitude" }
    }

    if (data.latitude < -90 || data.latitude > 90) {
      return { success: false, error: "Latitude must be between -90 and 90" }
    }

    if (typeof data.longitude !== "number") {
      return { success: false, error: "Static locations require a longitude" }
    }

    if (data.longitude < -180 || data.longitude > 180) {
      return { success: false, error: "Longitude must be between -180 and 180" }
    }

    // Waypoints should not be present for static locations
    if (data.waypoints !== undefined && data.waypoints !== null) {
      return { success: false, error: "Static locations should not have waypoints" }
    }
  } else if (data.type === "route") {
    // Routes require waypoints array with at least 2 waypoints
    if (!Array.isArray(data.waypoints)) {
      return { success: false, error: "Routes require a waypoints array" }
    }

    if (data.waypoints.length < 2) {
      return { success: false, error: "Routes must have at least 2 waypoints" }
    }

    if (data.waypoints.length > 500) {
      return { success: false, error: "Routes are limited to 500 waypoints" }
    }

    // Validate each waypoint
    for (let i = 0; i < data.waypoints.length; i++) {
      const wp = data.waypoints[i]

      if (!wp || typeof wp !== "object") {
        return { success: false, error: `Waypoint ${i + 1}: Invalid waypoint object` }
      }

      const waypoint = wp as Record<string, unknown>

      if (typeof waypoint.latitude !== "number") {
        return { success: false, error: `Waypoint ${i + 1}: Latitude is required` }
      }

      if (waypoint.latitude < -90 || waypoint.latitude > 90) {
        return { success: false, error: `Waypoint ${i + 1}: Latitude must be between -90 and 90` }
      }

      if (typeof waypoint.longitude !== "number") {
        return { success: false, error: `Waypoint ${i + 1}: Longitude is required` }
      }

      if (waypoint.longitude < -180 || waypoint.longitude > 180) {
        return {
          success: false,
          error: `Waypoint ${i + 1}: Longitude must be between -180 and 180`,
        }
      }

      if (waypoint.speed !== undefined) {
        if (typeof waypoint.speed !== "number") {
          return { success: false, error: `Waypoint ${i + 1}: Speed must be a number` }
        }

        if (waypoint.speed < 0) {
          return { success: false, error: `Waypoint ${i + 1}: Speed must be non-negative` }
        }
      }
    }

    // Latitude and longitude should not be present for routes
    if (data.latitude !== undefined && data.latitude !== null) {
      return { success: false, error: "Routes should not have a latitude field" }
    }

    if (data.longitude !== undefined && data.longitude !== null) {
      return { success: false, error: "Routes should not have a longitude field" }
    }
  }

  return {
    success: true,
    data: {
      name: data.name.trim(),
      description: data.description ? (data.description as string).trim() : undefined,
      type: data.type as "static" | "route",
      latitude: data.latitude as number | undefined,
      longitude: data.longitude as number | undefined,
      waypoints: data.waypoints as
        | Array<{ latitude: number; longitude: number; speed?: number }>
        | undefined,
    },
  }
}
