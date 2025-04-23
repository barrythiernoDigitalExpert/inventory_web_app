// lib/utils/fileStorage.ts
import fs from 'fs';
import path from 'path';

// Fonction pour convertir base64 en buffer
const base64ToBuffer = (base64Image: string) => {
  const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data');
  }
  
  return Buffer.from(matches[2], 'base64');
};

// Sauvegarde l'image principale d'une propriété
export const savePropertyImage = async (base64Image: string, propertyRef: string) => {
  try {
    const buffer = base64ToBuffer(base64Image);
    
    // Créer le dossier si nécessaire
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'properties', propertyRef);
    fs.mkdirSync(dirPath, { recursive: true });
    
    // Sauvegarder l'image
    const filename = 'main.jpg';
    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, buffer);
    
    // Retourner le chemin relatif pour stockage en BDD
    return `/uploads/properties/${propertyRef}/${filename}`;
  } catch (error) {
    console.error('Error saving property image:', error);
    throw error;
  }
};

// Sauvegarde plusieurs images pour une pièce
export const saveRoomImages = async (base64Images: string[], propertyRef: string, roomCode: string) => {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'properties', propertyRef, 'rooms', roomCode);
    fs.mkdirSync(dirPath, { recursive: true });
    
    const savedPaths = [];
    
    for (const [index, base64Image] of base64Images.entries()) {
      try {
        const buffer = base64ToBuffer(base64Image);
        const filename = `image-${index + 1}.jpg`;
        const filePath = path.join(dirPath, filename);
        
        fs.writeFileSync(filePath, buffer);
        savedPaths.push(`/uploads/properties/${propertyRef}/rooms/${roomCode}/${filename}`);
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

// Sauvegarde l'image d'un élément d'inventaire
export const saveItemImage = async (base64Image: string, propertyRef: string, roomCode: string, itemId: string) => {
  try {
    const buffer = base64ToBuffer(base64Image);
    
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'properties', propertyRef, 'rooms', roomCode, 'items');
    fs.mkdirSync(dirPath, { recursive: true });
    
    const filename = `item-${itemId}.jpg`;
    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, buffer);
    
    return `/uploads/properties/${propertyRef}/rooms/${roomCode}/items/${filename}`;
  } catch (error) {
    console.error('Error saving item image:', error);
    throw error;
  }
};

// Supprime tous les fichiers associés à une propriété
export const deletePropertyFiles = (propertyRef: string) => {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'properties', propertyRef);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error deleting property files:', error);
    throw error;
  }
};