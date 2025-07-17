// src/lib/services/proximityService.ts
import { prisma } from '@/lib/utils/prisma';

interface ProximityCheckParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  userId?: number; // Optional: exclude visits from specific user (Int to match User model)
}

interface ProximityResult {
  isNearby: boolean;
  distance?: number;
  nearbyVisit?: {
    id: string;
    userName: string;
    houseName: string;
    createdAt: Date;
    contactMethod: string;
  };
  message: string;
}

export class ProximityService {
  private static readonly DEFAULT_RADIUS_METERS = 100;
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculate distance between two GPS points using Haversine formula
   * @param lat1 First point latitude
   * @param lon1 First point longitude  
   * @param lat2 Second point latitude
   * @param lon2 Second point longitude
   * @returns Distance in meters
   */
  private static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * 
      Math.cos(this.degreesToRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = this.EARTH_RADIUS_KM * c;
    
    return distanceKm * 1000; // Convert to meters
  }

  /**
   * Convert degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if a location is within specified radius of any existing visits
   * @param params Proximity check parameters
   * @returns ProximityResult indicating if location is too close to existing visits
   */
  static async checkProximity(params: ProximityCheckParams): Promise<ProximityResult> {
    const { 
      latitude, 
      longitude, 
      radiusMeters = this.DEFAULT_RADIUS_METERS,
      userId 
    } = params;

    try {
      // Input validation
      if (!this.isValidCoordinate(latitude, longitude)) {
        return {
          isNearby: false,
          message: 'Invalid GPS coordinates provided'
        };
      }

      // Get all canvassing visits to check proximity
      // We'll filter in-memory for precise distance calculation
      const existingVisits = await prisma.canvassingVisit.findMany({
        where: userId ? {
          visitUsers: {
            none: { userId } // Exclude visits from the same user if specified
          }
        } : undefined,
        select: {
          id: true,
          latitude: true,
          longitude: true,
          houseName: true,
          createdAt: true,
          contactMethod: true,
          visitUsers: {
            select: {
              userId: true,
              userName: true
            }
          }
        },
        // Only get recent visits (last 6 months) for performance
        orderBy: {
          createdAt: 'desc'
        },
        take: 1000 // Reasonable limit for proximity checking
      });

      // Find the closest visit within radius
      let closestVisit: any = null;
      let minDistance = Infinity;

      for (const visit of existingVisits) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          visit.latitude,
          visit.longitude
        );

        if (distance <= radiusMeters && distance < minDistance) {
          minDistance = distance;
          closestVisit = {
            id: visit.id,
            userName: visit.visitUsers.map(vu => vu.userName).join(', '),
            houseName: visit.houseName,
            createdAt: visit.createdAt,
            contactMethod: visit.contactMethod,
            distance: Math.round(distance)
          };
        }
      }

      if (closestVisit) {
        return {
          isNearby: true,
          distance: closestVisit.distance,
          nearbyVisit: closestVisit,
          message: `Location is ${closestVisit.distance}m away from a previous visit by ${closestVisit.userName} on ${this.formatDate(closestVisit.createdAt)}`
        };
      }

      return {
        isNearby: false,
        message: 'Location is clear - no recent visits within the specified radius'
      };

    } catch (error) {
      console.error('Error checking proximity:', error);
      return {
        isNearby: false,
        message: 'Error checking location proximity. Please try again.'
      };
    }
  }

  /**
   * Get all visits within specified radius of a location
   * @param params Proximity check parameters
   * @returns Array of nearby visits with distances
   */
  static async getNearbyVisits(params: ProximityCheckParams) {
    const { 
      latitude, 
      longitude, 
      radiusMeters = this.DEFAULT_RADIUS_METERS,
      userId 
    } = params;

    try {
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Invalid GPS coordinates provided');
      }

      const existingVisits = await prisma.canvassingVisit.findMany({
        where: userId ? {
          visitUsers: {
            none: { userId }
          }
        } : undefined,
        include: {
          visitUsers: {
            select: {
              userId: true,
              userName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const nearbyVisits = [];

      for (const visit of existingVisits) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          visit.latitude,
          visit.longitude
        );

        if (distance <= radiusMeters) {
          nearbyVisits.push({
            ...visit,
            distance: Math.round(distance)
          });
        }
      }

      // Sort by distance (closest first)
      nearbyVisits.sort((a, b) => a.distance - b.distance);

      return nearbyVisits;

    } catch (error) {
      console.error('Error getting nearby visits:', error);
      throw error;
    }
  }

  /**
   * Validate GPS coordinates
   */
  private static isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Get visit density in an area (visits per square km)
   * @param latitude Center latitude
   * @param longitude Center longitude  
   * @param radiusMeters Radius to check
   * @returns Visit density information
   */
  static async getVisitDensity(
    latitude: number, 
    longitude: number, 
    radiusMeters: number = 1000
  ) {
    try {
      const nearbyVisits = await this.getNearbyVisits({
        latitude,
        longitude,
        radiusMeters
      });

      // Calculate area in square kilometers
      const areaKm2 = Math.PI * Math.pow(radiusMeters / 1000, 2);
      const density = nearbyVisits.length / areaKm2;

      return {
        totalVisits: nearbyVisits.length,
        areaKm2: Math.round(areaKm2 * 100) / 100,
        visitsPerKm2: Math.round(density * 100) / 100,
        radiusMeters
      };

    } catch (error) {
      console.error('Error calculating visit density:', error);
      throw error;
    }
  }
}