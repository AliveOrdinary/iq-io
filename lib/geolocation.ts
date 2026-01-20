export type Coordinates = {
  latitude: number
  longitude: number
}

export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (coord1.latitude * Math.PI) / 180
  const phi2 = (coord2.latitude * Math.PI) / 180
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Ray-casting algorithm to check if a point is inside a polygon
 * @param point - The point to check (latitude, longitude)
 * @param polygon - Array of [longitude, latitude] pairs (GeoJSON format)
 */
export function isPointInPolygon(
  point: Coordinates,
  polygon: [number, number][]
): boolean {
  const x = point.longitude
  const y = point.latitude
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
}

