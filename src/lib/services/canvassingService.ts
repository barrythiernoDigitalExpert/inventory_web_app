// src/lib/services/canvassingService.ts
import { prisma } from '@/lib/utils/prisma';
import { ContactMethod, ResponseType, ActivityType, EntityType } from '@/generated/prisma';
import { loggingService } from '@/lib/services/loggingService';

interface CreateVisitParams {
  userId: number;
  userName: string;
  additionalUsers?: { userId: number; userName: string }[];
  latitude: number;
  longitude: number;
  contactMethod: ContactMethod;
  houseName: string;
  vendorName?: string;
  comments?: string;
  streetAddress?: string;
  neighborhood?: string;
  city?: string;
  postalCode?: string;
  imagePath?: string;
  mobileId?: string;
}

interface UpdateVisitResponseParams {
  visitId: string;
  responseReceived?: ResponseType;
  comments?: string;
  userId?: number; // For authorization
}

interface VisitFilters {
  userId?: number;
  userIds?: number[];
  contactMethod?: ContactMethod;
  responseReceived?: ResponseType;
  startDate?: Date;
  endDate?: Date;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  limit?: number;
  offset?: number;
}

interface VisitStats {
  totalVisits: number;
  todayVisits: number;
  positiveResponses: number;
  negativeResponses: number;
  noResponses: number;
  pendingResponses: number;
  responseRate: number;
  averageResponseTime?: number;
  lastVisitDate?: Date;
  contactMethodBreakdown: Record<string, number>;
}

export class CanvassingService {
  
  /**
   * Create a new canvassing visit
   */
  static async createVisit(params: CreateVisitParams) {
    try {
      // Validate required fields
      if (!params.userId || !params.userName || !params.houseName) {
        throw new Error('Missing required fields: userId, userName, or houseName');
      }

      if (!this.isValidCoordinate(params.latitude, params.longitude)) {
        throw new Error('Invalid GPS coordinates');
      }

      // Create the visit with multiple users support
      const visit = await prisma.$transaction(async (tx) => {
        const newVisit = await tx.canvassingVisit.create({
          data: {
            latitude: params.latitude,
            longitude: params.longitude,
            contactMethod: params.contactMethod,
            houseName: params.houseName,
            vendorName: params.vendorName,
            comments: params.comments,
            streetAddress: params.streetAddress,
            neighborhood: params.neighborhood,
            city: params.city,
            postalCode: params.postalCode,
            imagePath: params.imagePath,
            mobileId: params.mobileId,
            isSynced: true,
            syncedAt: new Date(),
          }
        });

        // Add creator as first user
        await tx.canvassingVisitUser.create({
          data: {
            visitId: newVisit.id,
            userId: params.userId,
            userName: params.userName,
            isCreator: true
          }
        });

        // Add additional users if provided
        if (params.additionalUsers && params.additionalUsers.length > 0) {
          for (const additionalUser of params.additionalUsers) {
            await tx.canvassingVisitUser.create({
              data: {
                visitId: newVisit.id,
                userId: additionalUser.userId,
                userName: additionalUser.userName,
                isCreator: false
              }
            });
          }
        }

        // Return visit with users
        return await tx.canvassingVisit.findUnique({
          where: { id: newVisit.id },
          include: {
            visitUsers: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          }
        });
      });

      // Log user activity
      await loggingService.logActivity(
        params.userId,
        ActivityType.CANVASSING_VISIT,
        EntityType.CANVASSING_VISIT,
        visit!.id,
        {
          houseName: params.houseName,
          contactMethod: params.contactMethod,
          hasLocation: true,
          hasImage: !!params.imagePath,
          hasVendor: !!params.vendorName
        },
        'mobile',
        0
      );

      return visit;

    } catch (error) {
      console.error('Error creating canvassing visit:', error);
      throw error;
    }
  }

  /**
   * Get visits with filtering and pagination
   */
  static async getVisits(filters: VisitFilters = {}) {
    try {
      const {
        userId,
        userIds,
        contactMethod,
        responseReceived,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = filters;

      // Build where clause
      const where: any = {};

      if (userId) {
        where.id = {
          in: await prisma.canvassingVisitUser.findMany({
            where: { userId: userId },
            select: { visitId: true }
          }).then(results => results.map(r => r.visitId))
        };
      } else if (userIds && userIds.length > 0) {
        where.id = {
          in: await prisma.canvassingVisitUser.findMany({
            where: { userId: { in: userIds } },
            select: { visitId: true }
          }).then(results => results.map(r => r.visitId))
        };
      }

      if (contactMethod) {
        where.contactMethod = contactMethod;
      }

      if (responseReceived !== undefined) {
        where.responseReceived = responseReceived;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get visit configuration for revisit logic
      const visitConfig = await prisma.visitConfiguration.findFirst({
        where: { isActive: true },
        select: { revisitDelayHours: true }
      });
      const revisitDelayHours = visitConfig?.revisitDelayHours || 168; // Default 1 week

      const [visits, totalCount] = await Promise.all([
        prisma.canvassingVisit.findMany({
          where,
          include: {
            visitUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              },
              orderBy: {
                joinedAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit,
          skip: offset
        }),
        prisma.canvassingVisit.count({ where })
      ]);

      // Add revisit information and format user data
      const visitsWithRevisitInfo = visits.map(visit => {
        const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60);
        const canRevisit = (visit.responseReceived === ResponseType.pending || visit.responseReceived === null) && hoursSinceVisit >= revisitDelayHours;
        
        return {
          ...visit,
          userNames: visit.visitUsers.map(vu => vu.userName).join(', '),
          users: visit.visitUsers.map(vu => ({
            id: vu.user.id,
            name: vu.user.name,
            email: vu.user.email,
            isCreator: vu.isCreator,
            joinedAt: vu.joinedAt
          })),
          canRevisit,
          hoursSinceVisit: Math.round(hoursSinceVisit),
          hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceVisit)
        };
      });

      return {
        visits: visitsWithRevisitInfo,
        totalCount,
        hasMore: offset + limit < totalCount,
        visitConfig: {
          revisitDelayHours
        }
      };

    } catch (error) {
      console.error('Error getting visits:', error);
      throw error;
    }
  }

  /**
   * Get visits by specific user
   */
  static async getVisitsByUser(userId: number, limit: number = 100) {
    try {
      const visitIds = await prisma.canvassingVisitUser.findMany({
        where: { userId: userId },
        select: { visitId: true }
      });
      
      return await prisma.canvassingVisit.findMany({
        where: {
          id: { in: visitIds.map(v => v.visitId) }
        },
        include: {
          visitUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            },
            orderBy: {
              joinedAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
    } catch (error) {
      console.error('Error getting visits by user:', error);
      throw error;
    }
  }

  /**
   * Update visit response
   */
  static async updateVisitResponse(params: UpdateVisitResponseParams) {
    try {
      const { visitId, responseReceived, comments, userId } = params;

      // Check if visit exists and user has permission to update
      const existingVisit = await prisma.canvassingVisit.findUnique({
        where: { id: visitId },
        include: {
          visitUsers: {
            include: {
              user: {
                select: { role: true }
              }
            }
          }
        }
      });

      if (!existingVisit) {
        throw new Error('Visit not found');
      }

      // Authorization check - only visit members or admin can update
      if (userId) {
        const isVisitMember = existingVisit.visitUsers.some(vu => vu.userId === userId);
        const requestingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (!isVisitMember && (!requestingUser || requestingUser.role !== 'ADMIN')) {
          throw new Error('Unauthorized to update this visit');
        }
      }

      // Update the visit
      const updatedVisit = await prisma.canvassingVisit.update({
        where: { id: visitId },
        data: {
          responseReceived,
          comments,
          responseDate: responseReceived ? new Date() : null,
          updatedAt: new Date()
        },
        include: {
          visitUsers: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      // Log the update activity
      if (userId) {
        await loggingService.logActivity(
          userId,
          ActivityType.EDIT_PROPERTY,
          EntityType.CANVASSING_VISIT,
          visitId,
          {
            responseReceived,
            houseName: existingVisit.houseName
          },
          'web',
          0
        );
      }

      return updatedVisit;

    } catch (error) {
      console.error('Error updating visit response:', error);
      throw error;
    }
  }

  /**
   * Get visit statistics for a user or overall
   */
  static async getVisitStats(userId?: number): Promise<VisitStats> {
    try {
      let where = {};
      if (userId) {
        const visitIds = await prisma.canvassingVisitUser.findMany({
          where: { userId: userId },
          select: { visitId: true }
        });
        where = {
          id: { in: visitIds.map(v => v.visitId) }
        };
      }
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Get all visits count
      const totalVisits = await prisma.canvassingVisit.count({ where });
      
      // Get today's visits count
      const todayVisits = await prisma.canvassingVisit.count({
        where: {
          ...where,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // Get response counts
      const [positiveResponses, negativeResponses, noResponses, pendingResponses] = await Promise.all([
        prisma.canvassingVisit.count({
          where: { ...where, responseReceived: ResponseType.positive }
        }),
        prisma.canvassingVisit.count({
          where: { ...where, responseReceived: ResponseType.negative }
        }),
        prisma.canvassingVisit.count({
          where: { ...where, responseReceived: ResponseType.no_response }
        }),
        prisma.canvassingVisit.count({
          where: { ...where, responseReceived: null }
        })
      ]);

      // Calculate response rate
      const totalWithResponses = positiveResponses + negativeResponses + noResponses;
      const responseRate = totalVisits > 0 ? (totalWithResponses / totalVisits) * 100 : 0;

      // Get contact method breakdown
      const contactMethodResults = await prisma.canvassingVisit.groupBy({
        by: ['contactMethod'],
        where,
        _count: {
          contactMethod: true
        }
      });

      const contactMethodBreakdown: Record<string, number> = {};
      contactMethodResults.forEach(result => {
        contactMethodBreakdown[result.contactMethod] = result._count.contactMethod;
      });

      // Get last visit date
      const lastVisit = await prisma.canvassingVisit.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      // Calculate average response time (in days)
      const respondedVisits = await prisma.canvassingVisit.findMany({
        where: {
          ...where,
          responseReceived: { not: null },
          responseDate: { not: null }
        },
        select: {
          createdAt: true,
          responseDate: true
        }
      });

      let averageResponseTime: number | undefined;
      if (respondedVisits.length > 0) {
        const totalResponseTime = respondedVisits.reduce((sum, visit) => {
          const responseTime = visit.responseDate!.getTime() - visit.createdAt.getTime();
          return sum + responseTime;
        }, 0);
        averageResponseTime = Math.round(totalResponseTime / respondedVisits.length / (1000 * 60 * 60 * 24)); // Convert to days
      }

      return {
        totalVisits,
        todayVisits,
        positiveResponses,
        negativeResponses,
        noResponses,
        pendingResponses,
        responseRate: Math.round(responseRate * 10) / 10, // Round to 1 decimal
        averageResponseTime,
        lastVisitDate: lastVisit?.createdAt,
        contactMethodBreakdown
      };

    } catch (error) {
      console.error('Error getting visit stats:', error);
      throw error;
    }
  }

  /**
   * Get admin dashboard data - stats for all users
   */
  static async getAdminDashboardData() {
    try {
      // Get all users who have made visits
      const usersWithVisits = await prisma.canvassingVisitUser.groupBy({
        by: ['userId', 'userName'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Get detailed stats for each user
      const userStats = await Promise.all(
        usersWithVisits.map(async (userGroup) => {
          const stats = await this.getVisitStats(userGroup.userId);
          return {
            userId: userGroup.userId,
            userName: userGroup.userName,
            ...stats
          };
        })
      );

      // Get overall stats
      const overallStats = await this.getVisitStats();

      // Get recent activity
      const recentVisits = await prisma.canvassingVisit.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          visitUsers: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return {
        overallStats,
        userStats,
        recentVisits,
        totalUsers: usersWithVisits.length
      };

    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get visits for map display with clustering data
   */
  static async getVisitsForMap(filters: VisitFilters = {}) {
    try {
      const visits = await this.getVisits({
        ...filters,
        limit: 1000 // Reasonable limit for map display
      });

      // Group visits by proximity for clustering
      const clusteredVisits = this.clusterVisitsByProximity(visits.visits);

      return {
        visits: visits.visits,
        clusters: clusteredVisits,
        totalCount: visits.totalCount
      };

    } catch (error) {
      console.error('Error getting visits for map:', error);
      throw error;
    }
  }

  /**
   * Delete a visit (admin only)
   */
  static async deleteVisit(visitId: string, userId: number) {
    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Check if visit exists
      const visit = await prisma.canvassingVisit.findUnique({
        where: { id: visitId }
      });

      if (!visit) {
        throw new Error('Visit not found');
      }

      // Delete the visit
      await prisma.canvassingVisit.delete({
        where: { id: visitId }
      });

      // Log the deletion
      await loggingService.logActivity(
        userId,
        ActivityType.DELETE_PROPERTY,
        EntityType.CANVASSING_VISIT,
        visitId,
        {
          houseName: visit.houseName
        },
        'web',
        0
      );

      return { success: true };

    } catch (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  }

  /**
   * Sync multiple visits from mobile
   */
  static async syncVisitsFromMobile(visits: CreateVisitParams[]) {
    try {
      const results = [];
      const errors = [];

      for (const visitData of visits) {
        try {
          const visit = await this.createVisit(visitData);
          results.push(visit);
        } catch (error) {
          errors.push({
            visitData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        successful: results,
        failed: errors,
        totalProcessed: visits.length,
        successCount: results.length,
        errorCount: errors.length
      };

    } catch (error) {
      console.error('Error syncing visits from mobile:', error);
      throw error;
    }
  }

  // Private helper methods

  private static isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }


  private static clusterVisitsByProximity(visits: any[], clusterRadiusMeters: number = 100) {
    const clusters: any[] = [];
    const processed = new Set<string>();

    for (const visit of visits) {
      if (processed.has(visit.id)) continue;

      const cluster = {
        id: `cluster_${visit.id}`,
        centerLat: visit.latitude,
        centerLng: visit.longitude,
        visits: [visit],
        count: 1
      };

      // Find nearby visits
      for (const otherVisit of visits) {
        if (otherVisit.id === visit.id || processed.has(otherVisit.id)) continue;

        const distance = this.calculateDistance(
          visit.latitude,
          visit.longitude,
          otherVisit.latitude,
          otherVisit.longitude
        );

        if (distance <= clusterRadiusMeters) {
          cluster.visits.push(otherVisit);
          cluster.count++;
          processed.add(otherVisit.id);
        }
      }

      processed.add(visit.id);
      clusters.push(cluster);
    }

    return clusters;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * 
      Math.cos(this.degreesToRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}