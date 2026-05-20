import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/utils/auth'
import { ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * GET: Retrieve visit configuration settings
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Only admins can access visit configuration
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    // Get the active configuration (there should only be one active at a time)
    const config = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // If no config exists, create default one
    if (!config) {
      const defaultConfig = await prisma.visitConfiguration.create({
        data: {
          revisitDelayHours: 168, // 1 week default
          isActive: true
        }
      })

      const processingTime = Date.now() - startTime
      await loggingService.logActivity(
        user.id,
        ActivityType.CANVASSING_VISIT,
        EntityType.SYSTEM,
        defaultConfig.id.toString(),
        { action: 'create_default_visit_config', revisitDelayHours: 168 },
        context.deviceType,
        processingTime
      )

      return NextResponse.json({
        success: true,
        data: { configuration: defaultConfig },
        processingTime
      })
    }

    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.CANVASSING_VISIT,
      EntityType.SYSTEM,
      config.id.toString(),
      { action: 'view_visit_config' },
      context.deviceType,
      processingTime
    )

    return NextResponse.json({
      success: true,
      data: { configuration: config },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'admin/visit-config/GET',
      user?.id,
      context
    )
    console.error(`Error fetching visit configuration (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch visit configuration',
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update visit configuration settings
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Only admins can modify visit configuration
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { revisitDelayHours } = body

    // Validate input
    if (!revisitDelayHours || revisitDelayHours < 1 || revisitDelayHours > 8760) { // Max 1 year
      return NextResponse.json(
        {
          success: false,
          error: 'Revisit delay must be between 1 and 8760 hours (1 year)',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Deactivate all existing configurations
    await prisma.visitConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Create new configuration
    const newConfig = await prisma.visitConfiguration.create({
      data: {
        revisitDelayHours: parseInt(revisitDelayHours),
        isActive: true
      }
    })

    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.CANVASSING_VISIT,
      EntityType.SYSTEM,
      newConfig.id.toString(),
      { 
        action: 'update_visit_config', 
        revisitDelayHours: newConfig.revisitDelayHours,
        previousConfigs: 'deactivated'
      },
      context.deviceType,
      processingTime
    )

    console.log(`Visit configuration updated by admin ${user.id}: ${revisitDelayHours} hours`)

    return NextResponse.json({
      success: true,
      data: { configuration: newConfig },
      message: `Visit configuration updated successfully. Revisit delay set to ${revisitDelayHours} hours.`,
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'admin/visit-config/PUT',
      user?.id,
      context
    )
    console.error(`Error updating visit configuration (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update visit configuration',
        processingTime
      },
      { status: 500 }
    )
  }
}