// src/lib/services/roomImageService.ts
import { toast } from 'react-hot-toast';

export interface RoomImage {
  id: string;
  url: string; // In API, this maps to imagePath
  createdAt: string;
}

/**
 * Fetches all images for a specific room
 */
export async function fetchRoomImages(propertyId: string, roomId: string): Promise<RoomImage[]> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch room images');
    }

    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error('Error in fetchRoomImages:', error);
    toast.error('Failed to load room images');
    return [];
  }
}

/**
 * Adds new images to a room
 */
export async function addRoomImages(
  propertyId: string, 
  roomId: string, 
  images: File[]
): Promise<RoomImage[] | null> {
  try {
    const imagePromises = images.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    const base64Images = await Promise.all(imagePromises);

    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: base64Images }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add room images');
    }

    const data = await response.json();
    toast.success(`${images.length} image(s) added successfully`);
    return data.images;
  } catch (error) {
    console.error('Error in addRoomImages:', error);
    toast.error('Failed to add images');
    return null;
  }
}

/**
 * Deletes an image from a room
 */
export async function deleteRoomImage(
  propertyId: string,
  roomId: string,
  imageId: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete room image');
    }

    toast.success('Image deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteRoomImage:', error);
    toast.error('Failed to delete image');
    return false;
  }
}

/**
 * Utility function for placeholder images (development only)
 */
export function getPlaceholderImages(count: number = 4): RoomImage[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `placeholder-${index + 1}`,
    url: `/images/rooms/room-view-${(index % 4) + 1}.jpg`,
    createdAt: new Date().toISOString()
  }));
}

/**
 * Uploads multiple images with progress tracking
 */
export async function uploadRoomImages(
  propertyId: string,
  roomId: string,
  files: File[],
  onProgress?: (progress: number) => void
): Promise<RoomImage[] | null> {
  try {
    if (!files.length) {
      toast.error('No files selected');
      return null;
    }
    
    if (files.length > 10) {
      toast.error('Maximum 10 files can be uploaded at once');
      return null;
    }
    
    toast.loading('Preparing files for upload...');
    
    const imagePromises = files.map((file, index) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            if (onProgress) {
              onProgress((index + 1) / files.length * 50);
            }
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    const base64Images = await Promise.all(imagePromises);
    toast.dismiss();
    toast.loading('Uploading images...');
    
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: base64Images }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload images');
    }

    toast.dismiss();
    const data = await response.json();
    
    if (onProgress) {
      onProgress(100);
    }
    
    toast.success(`${files.length} image(s) uploaded successfully`);
    return data.images;
  } catch (error) {
    console.error('Error in uploadRoomImages:', error);
    toast.dismiss();
    toast.error('Failed to upload images');
    
    if (onProgress) {
      onProgress(0);
    }
    
    return null;
  }
}