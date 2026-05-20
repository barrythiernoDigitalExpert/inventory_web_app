import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * GET: Retrieve the latest visit configuration
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    // Verify authentication
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    user = authResult.user

    // Get the latest active configuration
    const config = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // If no config exists, return default values
    if (!config) {
      const defaultConfig = {
        id: null,
        revisitDelayHours: 168, // 1 week default
        revisitDelayDays: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        data: { 
          configuration: defaultConfig,
          isDefault: true
        },
        processingTime
      })
    }

    // Add days conversion
    const configWithDays = {
      ...config,
      revisitDelayDays: Math.round(config.revisitDelayHours / 24)
    }

    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.SYSTEM,
      config.id.toString(),
      { action: 'view_visit_config' },
      context.deviceType,
      processingTime
    )

    return NextResponse.json({
      success: true,
      data: { 
        configuration: configWithDays,
        isDefault: false
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'visit-config/GET',
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
 * POST: Create or update visit configuration
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    // Verify authentication
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    user = authResult.user

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

    // Check if there's an existing active configuration
    const existingConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true }
    })

    let config: any

    if (existingConfig) {
      // Update existing configuration
      config = await prisma.visitConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          revisitDelayHours: parseInt(revisitDelayHours),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new configuration
      config = await prisma.visitConfiguration.create({
        data: {
          revisitDelayHours: parseInt(revisitDelayHours),
          isActive: true
        }
      })
    }

    // Add days conversion
    const configWithDays = {
      ...config,
      revisitDelayDays: Math.round(config.revisitDelayHours / 24)
    }

    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.CANVASSING_VISIT,
      EntityType.SYSTEM,
      config.id.toString(),
      { 
        action: existingConfig ? 'update_visit_config' : 'create_visit_config', 
        revisitDelayHours: config.revisitDelayHours,
        revisitDelayDays: Math.round(config.revisitDelayHours / 24)
      },
      context.deviceType,
      processingTime
    )

    console.log(`Visit configuration ${existingConfig ? 'updated' : 'created'} by admin ${user.id}: ${revisitDelayHours} hours`)

    return NextResponse.json({
      success: true,
      data: { configuration: configWithDays },
      message: `Visit configuration ${existingConfig ? 'updated' : 'created'} successfully. Revisit delay set to ${revisitDelayHours} hours (${Math.round(revisitDelayHours / 24)} days).`,
      processingTime
    }, { status: existingConfig ? 200 : 201 })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'visit-config/POST',
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