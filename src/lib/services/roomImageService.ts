// src/lib/services/roomImageService.ts
import { toast } from 'react-hot-toast';

export interface RoomImage {
  id: string;
  url: string;
  isMainImage: boolean;
  sortOrder: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches all images for a room
 */
export async function fetchRoomImages(propertyId: string, roomId: string): Promise<RoomImage[]> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch room images');
    }

    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error('Error fetching room images:', error);
    toast.error('Failed to load room images');
    return [];
  }
}

/**
 * Converts files to base64
 */
async function filesToBase64(files: File[], onProgress?: (progress: number) => void): Promise<string[]> {
  const imagePromises = files.map((file, index) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (onProgress) {
            onProgress((index + 1) / files.length * 50); // 0-50% progress for file reading
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

  return Promise.all(imagePromises);
}

/**
 * Adds images to a room
 */
export async function addRoomImages(
  propertyId: string, 
  roomId: string, 
  images: File[],
  descriptions?: string[],
  mainImageIndex?: number
): Promise<RoomImage[] | null> {
  try {
    const base64Images = await filesToBase64(images);

    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        images: base64Images,
        descriptions,
        mainImageIndex
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add room images');
    }

    const data = await response.json();
    toast.success(`${images.length} image(s) added successfully`);
    return data.images;
  } catch (error) {
    console.error('Error adding room images:', error);
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
    console.error('Error deleting room image:', error);
    toast.error('Failed to delete image');
    return false;
  }
}

/**
 * Sets an image as the main image for a room
 */
export async function setMainRoomImage(
  propertyId: string,
  roomId: string,
  imageId: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images/${imageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isMainImage: true }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set main image');
    }

    toast.success('Main image updated');
    return true;
  } catch (error) {
    console.error('Error setting main image:', error);
    toast.error('Failed to update main image');
    return false;
  }
}

/**
 * Updates an image's metadata (description, sort order)
 */
export async function updateImageMetadata(
  propertyId: string,
  roomId: string,
  imageId: string,
  data: {
    description?: string;
    sortOrder?: number;
  }
): Promise<RoomImage | null> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images/${imageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update image metadata');
    }

    const result = await response.json();
    toast.success('Image updated successfully');
    return result.image;
  } catch (error) {
    console.error('Error updating image metadata:', error);
    toast.error('Failed to update image');
    return null;
  }
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
    
    const base64Images = await filesToBase64(files, onProgress);
    
    toast.dismiss();
    toast.loading('Uploading images...');
    
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: base64Images }),
    });

    toast.dismiss();
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload images');
    }

    const data = await response.json();
    
    if (onProgress) {
      onProgress(100);
    }
    
    toast.success(`${files.length} image(s) uploaded successfully`);
    return data.images;
  } catch (error) {
    console.error('Error uploading room images:', error);
    toast.dismiss();
    toast.error('Failed to upload images');
    
    if (onProgress) {
      onProgress(0);
    }
    
    return null;
  }
}

/**
 * Updates an existing image
 */
export async function updateRoomImage(
  propertyId: string,
  roomId: string,
  imageId: string,
  imageData: string,
  description?: string
): Promise<RoomImage | null> {
  try {
    const toastId = toast.loading('Updating image...');
    
    const requestData: any = { image: imageData };
    if (description !== undefined) {
      requestData.description = description;
    }
    
    const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images/${imageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    toast.dismiss(toastId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update image');
    }

    const result = await response.json();
    toast.success('Image updated successfully');
    
    return result.image;
  } catch (error) {
    console.error('Error updating room image:', error);
    toast.error('Failed to update image');
    return null;
  }
}

export const uploadRoomImagesWithDescriptions = async (
  propertyId: string,
  roomId: string,
  images: { dataUrl: string; description: string }[],
  mainImageIndex: number = 0
): Promise<RoomImage[]> => {
  const requestData = {
    images: images.map(img => img.dataUrl),
    descriptions: images.map(img => img.description || ''),
    mainImageIndex
  };

  const response = await fetch(`/api/properties/${propertyId}/rooms/${roomId}/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    throw new Error('Failed to upload images with descriptions');
  }

  const result = await response.json();
  return result.images;
}

/**
 * Reorders images in a room
 */
export async function reorderRoomImages(
  propertyId: string,
  roomId: string,
  imageOrders: { id: string; sortOrder: number }[]
): Promise<boolean> {
  try {
    const toastId = toast.loading('Updating image order...');
    
    const updatePromises = imageOrders.map(item => 
      fetch(`/api/properties/${propertyId}/rooms/${roomId}/images/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sortOrder: item.sortOrder }),
      })
    );
    
    const results = await Promise.all(updatePromises);
    
    toast.dismiss(toastId);
    
    if (results.some(r => !r.ok)) {
      throw new Error('Failed to update some images');
    }
    
    toast.success('Image order updated');
    return true;
  } catch (error) {
    console.error('Error reordering images:', error);
    toast.error('Failed to update image order');
    return false;
  }
}