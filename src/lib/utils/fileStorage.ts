// src/lib/utils/fileStorage.ts - correction de l'erreur de typage avec Cloudinary
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
 * Convertit une image base64 au format accepté par Cloudinary
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
 * Sauvegarde l'image principale d'une propriété
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
 * Sauvegarde plusieurs images pour une pièce
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
 * Sauvegarde une image pour un élément d'inventaire
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
 * Supprime tous les fichiers associés à une propriété
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
 * Supprime une image de pièce en fonction de son URL Cloudinary
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
 * Fonction auxiliaire pour extraire l'ID public Cloudinary d'une URL
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