import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

// GET: Get all available property features (categories, features, and options)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all active categories with their features and options
    const categories = await prisma.propertyFeatureCategory.findMany({
      where: { isActive: true },
      include: {
        features: {
          where: { isActive: true },
          include: {
            options: true
          },
          orderBy: { sort: 'asc' }
        }
      },
      orderBy: { sort: 'asc' }
    });
    
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      features: category.features.map(feature => ({
        id: feature.id,
        name: feature.name,
        type: feature.type,
        options: feature.options.map(option => ({
          id: option.id,
          value: option.value
        }))
      }))
    }));
    
    return NextResponse.json({
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching property features:', error);
    return NextResponse.json({ error: 'Failed to fetch property features' }, { status: 500 });
  }
}
