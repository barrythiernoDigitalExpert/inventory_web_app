import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/utils/auth'
import { prisma } from '@/lib/utils/prisma'
import { UserRole, ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * GET: Retrieve dashboard statistics for admin
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get current date for weekly stats
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Fetch user statistics
    const userStats = await prisma.user.aggregate({
      _count: {
        id: true
      }
    })

    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    })

    const adminUsers = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    // Fetch property statistics
    const propertyStats = await prisma.property.aggregate({
      _count: {
        id: true
      }
    })

    const completedProperties = await prisma.property.count({
      where: { inventoryStatus: 'COMPLETED' }
    })

    const draftProperties = await prisma.property.count({
      where: { inventoryStatus: 'DRAFT' }
    })

    // Fetch visit statistics
    const visitStats = await prisma.canvassingVisit.aggregate({
      _count: {
        id: true
      }
    })

    const visitsThisWeek = await prisma.canvassingVisit.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    const positiveVisits = await prisma.canvassingVisit.count({
      where: { responseReceived: 'positive' }
    })

    const negativeVisits = await prisma.canvassingVisit.count({
      where: { responseReceived: 'negative' }
    })

    // Fetch image statistics
    const imageStats = await prisma.roomImage.aggregate({
      _count: {
        id: true
      }
    })

    const imagesThisWeek = await prisma.roomImage.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    const dashboardStats = {
      users: {
        total: userStats._count.id,
        active: activeUsers,
        admins: adminUsers
      },
      properties: {
        total: propertyStats._count.id,
        completed: completedProperties,
        draft: draftProperties
      },
      visits: {
        total: visitStats._count.id,
        thisWeek: visitsThisWeek,
        positive: positiveVisits,
        negative: negativeVisits
      },
      images: {
        total: imageStats._count.id,
        thisWeek: imagesThisWeek
      }
    }

    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.CANVASSING_VISIT, // Using existing enum value
      EntityType.SYSTEM,
      'dashboard_stats',
      { 
        action: 'view_dashboard_stats',
        statsRequested: Object.keys(dashboardStats)
      },
      context.deviceType,
      processingTime
    )

    return NextResponse.json(dashboardStats)

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'admin/dashboard-stats/GET',
      user?.id,
      context
    )
    console.error(`Error fetching dashboard statistics (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
        processingTime
      },
      { status: 500 }
    )
  }
}