// src/lib/services/propertyService.ts
export interface Room {
  id: string;
  code: string;
  name: string;
  image: string;
  hasImages: boolean;
  imageCount: number;
  images?: {
    id: string;
    path: string;
    isMain: boolean;
    description?: string;
  }[];
}

export interface Property {
  id: string;
  reference: string;
  name: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  image: string;
  roomCount: number;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  listingPerson:string,
  owner?: {
    name: string;
    email: string;
  };
  sharedWith?: {
    user: {
      name: string;
      email: string;
    };
    canEdit: boolean;
    canDelete: boolean;
  }[];
  rooms?: Room[];
}

export interface DashboardStats {
  totalProperties: number;
  recentlyUpdated: number;
  completedInventories: number;
  pendingInventories: number;
}

export interface RecentProperty {
  id: string;
  reference: string;
  name: string;
  image: string;
  lastUpdated: string;
  status?: 'Completed' | 'In Progress' | 'Pending';
}

export interface DashboardData {
  stats: DashboardStats;
  recentProperties: RecentProperty[];
}

export interface RoomImage {
  id: string;
  url: string;
  isMainImage: boolean;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyShare {
  id: string;
  propertyId: string;
  userId: string;
  canEdit: boolean;
  canDelete: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
/**
 * Fetches images for a room
 */
export const fetchImagesByRoom = async (roomId: string): Promise<RoomImage[]> => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/items`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch room images');
    }
    
    const images = await response.json();
    return images.map((image: any) => ({
      id: image.id,
      url: image.url,
      isMainImage: image.isMainImage,
      description: image.description || '',
      sortOrder: image.sortOrder,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    }));
  } catch (error) {
    console.error(`Error fetching images for room ${roomId}:`, error);
    throw error;
  }
};


/**
 * Fetches all properties with optional filtering
 */
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const response = await fetch(`${API_URL}/properties`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

/**
 * Fetches a property by ID with all related data
 */
export const fetchPropertyById = async (id: string): Promise<Property | null> => {
  try {
    const response = await fetch(`${API_URL}/properties/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching property ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches rooms for a property with images
 */
export const fetchPropertyRooms = async (propertyId: string): Promise<Room[]> => {
  try {
    const response = await fetch(`${API_URL}/properties/${propertyId}/rooms`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching rooms for property ${propertyId}:`, error);
    throw error;
  }
};

/**
 * Fetches dashboard data including stats and recent properties
 */
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    // Fetch stats
    const statsResponse = await fetch(`${API_URL}/dashboard/stats`);
    if (!statsResponse.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    const stats = await statsResponse.json();
    
    // Fetch recent properties
    const recentPropertiesResponse = await fetch(`${API_URL}/properties/recent`);
    if (!recentPropertiesResponse.ok) {
      throw new Error('Failed to fetch recent properties');
    }
    const recentProperties = await recentPropertiesResponse.json();
    
    return {
      stats,
      recentProperties
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Creates a new property
 */
export const createProperty = async (propertyData: {
  reference: string;
  name?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  image?: string;
  listingPerson?: string;
}): Promise<{ success: boolean; propertyId?: string; data?: any }> => {
  try {
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create property');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

/**
 * Updates an existing property
 */
export const updateProperty = async (
  propertyId: string,
  propertyData: Partial<Property>
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/properties/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update property');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating property ${propertyId}:`, error);
    throw error;
  }
};

/**
 * Deletes a property
 */
export const deleteProperty = async (propertyId: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/properties/${propertyId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete property');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting property ${propertyId}:`, error);
    throw error;
  }
};

/**
 * Adds a room to a property
 */
export const addPropertyRoom = async (
  propertyId: string,
  roomData: {
    code: string;
    name: string;
    images?: string[];
  }
): Promise<{ success: boolean; room?: Room }> => {
  try {
    const response = await fetch(`${API_URL}/properties/${propertyId}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roomData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add room');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error adding room to property ${propertyId}:`, error);
    throw error;
  }
};

export async function getPropertyShares(propertyId: string): Promise<PropertyShare[]> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/shares`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
       cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch property shares');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching property shares:', error);
    throw error;
  }
}

export async function sharePropertyWithUser(
  propertyId: string,
  userId: string,
  permissions: { canEdit: boolean; canDelete: boolean }
): Promise<PropertyShare> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...permissions,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to share property');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sharing property:', error);
    throw error;
  }
}

export async function removePropertyShare(propertyId: string, shareId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/shares/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove property share');
    }

    return true;
  } catch (error) {
    console.error('Error removing property share:', error);
    throw error;
  }
}