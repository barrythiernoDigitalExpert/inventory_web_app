export interface Room {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  hasImages?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  image?: string;
  notes?: string;
}

export interface Property {
  id: string;
  reference: string;
  name: string;
  address: string;
  image: string;
  createdAt: string;
  totalItems?: number;
}

export interface DashboardData {
  stats: {
    totalProperties: number;
    recentlyUpdated: number;
    completedInventories: number;
    pendingInventories: number;
  };
  recentProperties: {
    id: string;
    reference: string;
    name: string;
    image: string;
    lastUpdated: string;
    status?: 'Completed' | 'In Progress' | 'Pending';
  }[];
}

// Fonction pour récupérer toutes les propriétés
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const response = await fetch('/api/properties');
    
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

// Fonction pour récupérer une propriété par ID
export const fetchPropertyById = async (id: string): Promise<Property | null> => {
  try {
    const response = await fetch(`/api/properties/${id}`);
    
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

// Fonction pour récupérer les pièces d'une propriété
export const fetchPropertyRooms = async (propertyId: string): Promise<Room[]> => {
  try {
    const response = await fetch(`/api/properties/${propertyId}/rooms`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching rooms for property ${propertyId}:`, error);
    throw error;
  }
};

// Fonction pour récupérer les éléments d'inventaire d'une pièce
export const fetchRoomItems = async (roomId: string): Promise<InventoryItem[]> => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/items`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch inventory items');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching items for room ${roomId}:`, error);
    throw error;
  }
};

// Fonction pour récupérer les données du tableau de bord
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    // Récupérer les statistiques
    const statsResponse = await fetch('/api/dashboard/stats');
    if (!statsResponse.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    const stats = await statsResponse.json();
    
    // Récupérer les propriétés récentes
    const recentPropertiesResponse = await fetch('/api/properties/recent');
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

// Fonction pour créer une propriété
export const createProperty = async (propertyData: {
  reference: string;
  image: string;
  rooms: any[];
}): Promise<{ success: boolean; propertyId?: string }> => {
  try {
    const response = await fetch('/api/properties', {
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