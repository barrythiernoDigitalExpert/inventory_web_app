// src/lib/utils/fileStorage.ts
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Base directory for file storage
const STORAGE_DIR = path.join('/tmp', 'uploads');
/**
 * Ensures a directory exists
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Converts base64 to buffer
 */
const base64ToBuffer = (base64Image: string): Buffer => {
  const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data');
  }
  
  return Buffer.from(matches[2], 'base64');
};

/**
 * Saves the main image for a property
 */
export const savePropertyImage = async (base64Image: string, propertyRef: string): Promise<string> => {
  try {
    const buffer = base64ToBuffer(base64Image);
    
    const dirPath = path.join(STORAGE_DIR, 'properties', propertyRef);
    await ensureDirectory(dirPath);
    
    const filename = 'main.jpg';
    const filePath = path.join(dirPath, filename);
    await fsPromises.writeFile(filePath, buffer);
    
    return `/uploads/properties/${propertyRef}/${filename}`;
  } catch (error) {
    console.error('Error saving property image:', error);
    throw error;
  }
};

/**
 * Saves multiple images for a room
 */
export const saveRoomImages = async (
  base64Images: string[], 
  propertyRef: string, 
  roomCode: string
): Promise<string[]> => {
  try {
    const dirPath = path.join(STORAGE_DIR, 'properties', propertyRef, 'rooms', roomCode);
    await ensureDirectory(dirPath);
    
    const savedPaths: string[] = [];
    
    for (const [index, base64Image] of base64Images.entries()) {
      try {
        const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
        if (!matches || matches.length !== 3) {
          throw new Error('Invalid base64 image format');
        }
        
        const type = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');
        
        // Determine file extension based on MIME type
        let extension = 'jpg';
        if (type.includes('png')) {
          extension = 'png';
        } else if (type.includes('webp')) {
          extension = 'webp';
        } else if (type.includes('gif')) {
          extension = 'gif';
        }
        
        // Generate unique filename
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(dirPath, fileName);
        
        await fsPromises.writeFile(filePath, buffer);
        savedPaths.push(`/uploads/properties/${propertyRef}/rooms/${roomCode}/${fileName}`);
      } catch (error) {
        console.error(`Error saving room image ${index}:`, error);
      }
    }
    
    return savedPaths;
  } catch (error) {
    console.error('Error saving room images:', error);
    throw error;
  }
};

/**
 * Saves an image for an inventory item
 */
export const saveItemImage = async (
  base64Image: string, 
  propertyRef: string, 
  roomCode: string, 
  itemId: string
): Promise<string> => {
  try {
    const buffer = base64ToBuffer(base64Image);
    
    const dirPath = path.join(STORAGE_DIR, 'properties', propertyRef, 'rooms', roomCode, 'items');
    await ensureDirectory(dirPath);
    
    const filename = `item-${itemId}.jpg`;
    const filePath = path.join(dirPath, filename);
    await fsPromises.writeFile(filePath, buffer);
    
    return `/uploads/properties/${propertyRef}/rooms/${roomCode}/items/${filename}`;
  } catch (error) {
    console.error('Error saving item image:', error);
    throw error;
  }
};

/**
 * Deletes all files associated with a property
 */
export const deletePropertyFiles = async (propertyRef: string): Promise<void> => {
  try {
    const dirPath = path.join(STORAGE_DIR, 'properties', propertyRef);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error deleting property files:', error);
    throw error;
  }
};

/**
 * Deletes a room image based on its path
 */
export const deleteRoomImage = async (imagePath: string): Promise<boolean> => {
  try {
    const relativePath = imagePath.startsWith('/uploads/') 
      ? imagePath.substring('/uploads/'.length) 
      : imagePath;
    
    const fullPath = path.join(STORAGE_DIR, relativePath);
    
    try {
      await fsPromises.access(fullPath);
    } catch (error) {
      console.warn(`File ${fullPath} does not exist or is not accessible.`);
      return true;
    }
    
    await fsPromises.unlink(fullPath);
    
    console.log(`File successfully deleted: ${fullPath}`);
    return true;
  } catch (error) {
    console.error(`Error deleting image ${imagePath}:`, error);
    return false;
  }
};