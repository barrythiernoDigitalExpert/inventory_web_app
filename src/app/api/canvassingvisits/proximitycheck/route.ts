// src/app/api/canvassing-visits/proximity-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { ProximityService } from '@/lib/services/proximityService';
import { prisma } from '@/lib/utils/prisma';

// POST: Check if location is too close to existing visits
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { latitude, longitude, radiusMeters = 100, excludeOwnVisits = true } = body;

    // Validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates: latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180' },
        { status: 400 }
      );
    }

    if (radiusMeters < 1 || radiusMeters > 10000) {
      return NextResponse.json(
        { error: 'Invalid radius: must be between 1 and 10000 meters' },
        { status: 400 }
      );
    }

    // Check proximity
    const proximityResult = await ProximityService.checkProximity({
      latitude,
      longitude,
      radiusMeters,
      userId: excludeOwnVisits ? user.id : undefined
    });

    // Add additional context for the response
    const response = {
      ...proximityResult,
      checkedRadius: radiusMeters,
      coordinates: { latitude, longitude },
      excludedOwnVisits: excludeOwnVisits
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking proximity:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check proximity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Get nearby visits for a location
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radiusMeters = parseInt(searchParams.get('radiusMeters') || '100');
    const excludeOwnVisits = searchParams.get('excludeOwnVisits') !== 'false';

    // Validation
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Get nearby visits
    const nearbyVisits = await ProximityService.getNearbyVisits({
      latitude,
      longitude,
      radiusMeters,
      userId: excludeOwnVisits ? user.id : undefined
    });

    return NextResponse.json({
      nearbyVisits,
      totalCount: nearbyVisits.length,
      searchRadius: radiusMeters,
      coordinates: { latitude, longitude }
    });

  } catch (error) {
    console.error('Error getting nearby visits:', error);
    return NextResponse.json(
      { error: 'Failed to get nearby visits' },
      { status: 500 }
    );
  }
}