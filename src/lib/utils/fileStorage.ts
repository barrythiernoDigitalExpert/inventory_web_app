/**
 * File Storage Utility (Cloudinary)
 * --------------------------------
 * Provides functions to upload, save, and delete images for properties, rooms, and items using Cloudinary.
 * Handles base64 conversion, unique ID generation, and folder management for organized storage.
 *
 * Responsibilities:
 * - Save property, room, and item images to Cloudinary
 * - Delete images and folders from Cloudinary
 * - Convert base64 images to Cloudinary format
 * - Extract public IDs from Cloudinary URLs
 *
 * All functions are designed to be used by API route handlers, services, and components.
 */
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: "doklxv5l6",
  api_key: "341989844846657",
  api_secret: "kc5k5Zfx-OdWzmOovT8nxaL16o8",
  secure: true
});

/**
 * Converts a base64 image to a format accepted by Cloudinary.
 * @param base64Image The base64-encoded image string
 * @returns The formatted base64 image string
 * @throws Error if the image data is invalid
 */
const base64ToCloudinaryFormat = (base64Image: string): string => {
  // Vérifie si l'image est bien formatée en base64
  const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data');
  }
  
  return base64Image;
};

/**
 * Saves the main image for a property to Cloudinary.
 * @param base64Image The base64-encoded image string
 * @param propertyRef The property reference string
 * @returns The secure URL of the saved image
 * @throws Error if the upload fails
 */
export const savePropertyImage = async (base64Image: string, propertyRef: string): Promise<string> => {
  try {
    const formattedImage = base64ToCloudinaryFormat(base64Image);
    
    const result = await cloudinary.uploader.upload(formattedImage, {
      folder: `properties/${propertyRef}`,
      public_id: 'main',
      overwrite: true,
      resource_type: 'image' // Utiliser la valeur littérale correcte
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error saving property image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Saves multiple images for a room to Cloudinary.
 * @param base64Images Array of base64-encoded image strings
 * @param propertyRef The property reference string
 * @param roomCode The room code string
 * @returns Array of secure URLs of the saved images
 * @throws Error if the upload fails
 */
export const saveRoomImages = async (
  base64Images: string[], 
  propertyRef: string, 
  roomCode: string
): Promise<string[]> => {
  try {
    const savedUrls: string[] = [];
    
    for (const [index, base64Image] of base64Images.entries()) {
      try {
        // Validation du format de l'image
        if (!base64Image.startsWith('data:')) {
          console.error(`Image ${index} is not in base64 format`);
          continue;
        }
        
        // Générer un identifiant unique
        const uniqueId = uuidv4();
        
        // Définir les options d'upload avec le bon typage
        const uploadOptions = {
          folder: `properties/${propertyRef}/rooms/${roomCode}`,
          public_id: uniqueId,
          resource_type: 'image' as 'image', // Utiliser "as" pour le typage correct
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        };
        
        // Télécharger l'image vers Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, uploadOptions);
        
        // Ajouter l'URL de l'image sauvegardée
        savedUrls.push(result.secure_url);
      } catch (error) {
        console.error(`Error saving room image ${index} to Cloudinary:`, error);
      }
    }
    
    return savedUrls;
  } catch (error) {
    console.error('Error saving room images to Cloudinary:', error);
    throw error;
  }
};

/**
 * Saves an image for an inventory item to Cloudinary.
 * @param base64Image The base64-encoded image string
 * @param propertyRef The property reference string
 * @param roomCode The room code string
 * @param itemId The item ID string
 * @returns The secure URL of the saved image
 * @throws Error if the upload fails
 */
export const saveItemImage = async (
  base64Image: string, 
  propertyRef: string, 
  roomCode: string, 
  itemId: string
): Promise<string> => {
  try {
    const formattedImage = base64ToCloudinaryFormat(base64Image);
    
    const result = await cloudinary.uploader.upload(formattedImage, {
      folder: `properties/${propertyRef}/rooms/${roomCode}/items`,
      public_id: `item-${itemId}`,
      overwrite: true,
      resource_type: 'image' as 'image' // Utiliser "as" pour le typage correct
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error saving item image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Saves an image for a canvassing visit to Cloudinary.
 * @param base64Image The base64-encoded image string
 * @param visitId The visit ID string
 * @returns The secure URL of the saved image
 * @throws Error if the upload fails
 */
export const saveCanvassingImage = async (
  base64Image: string, 
  visitId: string
): Promise<string> => {
  try {
    const formattedImage = base64ToCloudinaryFormat(base64Image);
    
    const result = await cloudinary.uploader.upload(formattedImage, {
      folder: `canvassing/visits`,
      public_id: `visit-${visitId}`,
      overwrite: true,
      resource_type: 'image' as 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error saving canvassing image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Deletes all files associated with a property from Cloudinary.
 * @param propertyRef The property reference string
 * @returns void
 * @throws Error if the deletion fails
 */
export const deletePropertyFiles = async (propertyRef: string): Promise<void> => {
  try {
    // Supprimer dossier et toutes les ressources imbriquées
    await cloudinary.api.delete_resources_by_prefix(`properties/${propertyRef}/`);
    await cloudinary.api.delete_folder(`properties/${propertyRef}`);
  } catch (error) {
    console.error('Error deleting property files from Cloudinary:', error);
    throw error;
  }
};

/**
 * Deletes a room image from Cloudinary by its URL.
 * @param imageUrl The Cloudinary image URL
 * @returns True if deletion was successful, false otherwise
 */
export const deleteRoomImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraire l'ID public de l'URL
    const publicId = extractPublicIdFromUrl(imageUrl);
    
    if (!publicId) {
      console.warn(`Could not extract public ID from URL: ${imageUrl}`);
      return false;
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    console.log(`Image successfully deleted from Cloudinary: ${publicId}`);
    return result.result === 'ok';
  } catch (error) {
    console.error(`Error deleting image ${imageUrl} from Cloudinary:`, error);
    return false;
  }
};

/**
 * Helper function to extract the Cloudinary public ID from a URL.
 * @param url The Cloudinary image URL
 * @returns The extracted public ID or null if not found
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Format typique d'URL Cloudinary:
    // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public-id.jpg
    const regex = /\/v\d+\/(.+?)(?:\.[^.]+)?$/;
    const match = url.match(regex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Si le format standard ne correspond pas, essayez un format alternatif
    const altRegex = /\/upload\/(.+?)(?:\.[^.]+)?(?:\?.*)?$/;
    const altMatch = url.match(altRegex);
    
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};