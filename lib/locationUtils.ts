/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180
  const φ2 = (point2.latitude * Math.PI) / 180
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate bearing/heading from point1 to point2
 * Returns heading in degrees (0-360)
 */
export function calculateHeading(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const φ1 = (point1.latitude * Math.PI) / 180
  const φ2 = (point2.latitude * Math.PI) / 180
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  const heading = ((θ * 180) / Math.PI + 360) % 360

  return heading
}

/**
 * Check if a point is inside a circular geofence
 */
export function isInsideGeofence(
  point: { latitude: number; longitude: number },
  center: { latitude: number; longitude: number },
  radiusMeters: number
): boolean {
  const distance = calculateDistance(point, center)
  return distance <= radiusMeters
}
