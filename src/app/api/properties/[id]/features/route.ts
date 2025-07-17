import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

// Helper function to check property access
async function checkPropertyAccess(propertyId: number, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true }
  });

  if (!user) return null;

  if (user.role === 'ADMIN') {
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    return property ? { property, userId: user.id, isAdmin: true } : null;
  }
  
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { userId: user.id },
        {
          sharedWith: {
            some: {
              userId: user.id
            }
          }
        }
      ]
    }
  });
  
  return property ? { property, userId: user.id } : null;
}

// GET: Retrieve property features for a specific property
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(id, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Get property features with their values
    const propertyFeatures = await prisma.propertyPropertyFeature.findMany({
      where: { propertyId: id },
      include: {
        propertyFeature: {
          include: {
            category: true,
            options: true
          }
        },
        valueFeatureOption: true
      },
      orderBy: [
        { propertyFeature: { category: { sort: 'asc' } } },
        { propertyFeature: { sort: 'asc' } }
      ]
    });

    // Group features by category
    const groupedFeatures = propertyFeatures.reduce((acc, pf) => {
      const categoryId = pf.propertyFeature.category.id;
      const categoryName = pf.propertyFeature.category.name;
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          features: []
        };
      }
      
      // Determine the current value based on feature type
      let currentValue = null;
      switch (pf.propertyFeature.type) {
        case 'bool':
          currentValue = pf.valueBool;
          break;
        case 'text':
          currentValue = pf.valueText;
          break;
        case 'integer':
          currentValue = pf.valueInt;
          break;
        case 'float':
          currentValue = pf.valueFloat;
          break;
        case 'select':
          currentValue = pf.valueFeatureOption ? {
            id: pf.valueFeatureOption.id,
            value: pf.valueFeatureOption.value
          } : null;
          break;
      }
      
      acc[categoryId].features.push({
        id: pf.propertyFeature.id,
        name: pf.propertyFeature.name,
        type: pf.propertyFeature.type,
        options: pf.propertyFeature.options.map(opt => ({
          id: opt.id,
          value: opt.value
        })),
        currentValue
      });
      
      return acc;
    }, {} as Record<number, any>);
    
    return NextResponse.json({
      propertyId: id,
      categories: Object.values(groupedFeatures)
    });
  } catch (error) {
    console.error('Error fetching property features:', error);
    return NextResponse.json({ error: 'Failed to fetch property features' }, { status: 500 });
  }
}

// POST: Save/Update property features for a specific property
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(id, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Check if user has edit permission if the property is shared
    if (!access.isAdmin && access.property.userId !== access.userId) {
      const sharePermission = await prisma.propertyShare.findUnique({
        where: {
          propertyId_userId: {
            propertyId: id,
            userId: access.userId
          }
        }
      });
      
      if (!sharePermission?.canEdit) {
        return NextResponse.json({ error: 'You do not have permission to edit this property' }, { status: 403 });
      }
    }
    
    const body = await request.json();
    const { features } = body;
    
    if (!features || !Array.isArray(features)) {
      return NextResponse.json({ error: 'Invalid features data' }, { status: 400 });
    }
    
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Process each feature
      for (const feature of features) {
        const { featureId, value } = feature;
        
        if (!featureId) continue;
        
        // Get feature details to determine type
        const propertyFeature = await tx.propertyFeature.findUnique({
          where: { id: featureId }
        });
        
        if (!propertyFeature) continue;
        
        // Prepare data based on feature type
        const updateData: any = {
          propertyId: id,
          propertyFeatureId: featureId,
          valueText: null,
          valueBool: null,
          valueInt: null,
          valueFloat: null,
          valueFeatureOptionId: null
        };
        
        switch (propertyFeature.type) {
          case 'bool':
            updateData.valueBool = Boolean(value);
            break;
          case 'text':
            updateData.valueText = value;
            break;
          case 'integer':
            updateData.valueInt = value ? parseInt(value.toString()) : null;
            break;
          case 'float':
            updateData.valueFloat = value ? parseFloat(value.toString()) : null;
            break;
          case 'select':
            updateData.valueFeatureOptionId = value ? parseInt(value.toString()) : null;
            break;
        }
        
        // Upsert the property feature value
        await tx.propertyPropertyFeature.upsert({
          where: {
            propertyId_propertyFeatureId: {
              propertyId: id,
              propertyFeatureId: featureId
            }
          },
          update: updateData,
          create: updateData
        });
      }
    });
    
    return NextResponse.json({ success: true, message: 'Property features saved successfully' });
  } catch (error) {
    console.error('Error saving property features:', error);
    return NextResponse.json({ error: 'Failed to save property features' }, { status: 500 });
  }
}