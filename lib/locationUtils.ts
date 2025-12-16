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
 * Check if a point is inside a polygon geofence using ray casting algorithm
 * @param point The point to check
 * @param polygon Array of coordinates forming the polygon vertices
 * @returns true if point is inside the polygon, false otherwise
 */
export function isInsidePolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  if (polygon.length < 3) {
    return false // Not a valid polygon
  }

  let inside = false
  const x = point.longitude
  const y = point.latitude

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}
