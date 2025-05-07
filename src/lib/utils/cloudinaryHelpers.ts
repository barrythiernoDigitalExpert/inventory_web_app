// src/lib/utils/cloudinaryHelpers.ts

/**
 * Extrait l'ID public Cloudinary à partir d'une URL
 * @param url L'URL Cloudinary complète
 * @returns L'ID public extrait ou null si non trouvé
 */
export function extractPublicIdFromUrl(url: string): string | null {
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
  }
  
  /**
   * Génère une URL Cloudinary optimisée avec transformations
   * @param url L'URL Cloudinary d'origine
   * @param options Options de transformation (largeur, hauteur, qualité, etc.)
   * @returns L'URL transformée
   */
  export function getOptimizedImageUrl(
    url: string, 
    options: { 
      width?: number; 
      height?: number; 
      quality?: number; 
      format?: 'auto' | 'webp' | 'jpg' | 'png';
      crop?: 'fill' | 'crop' | 'scale' | 'fit';
    } = {}
  ): string {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return url;
      }
  
      // Valeurs par défaut
      const width = options.width || 0;
      const height = options.height || 0;
      const quality = options.quality || 'auto';
      const format = options.format || 'auto';
      const crop = options.crop || 'fill';
  
      // Construction de la chaîne de transformation
      const transformations = [];
      
      if (width > 0) transformations.push(`w_${width}`);
      if (height > 0) transformations.push(`h_${height}`);
      if (quality) transformations.push(`q_${quality}`);
      if (format) transformations.push(`f_${format}`);
      if (crop) transformations.push(`c_${crop}`);
  
      // N'appliquer les transformations que s'il y en a
      if (transformations.length === 0) {
        return url;
      }
  
      // Construire l'URL transformée
      // Remplacer /upload/ par /upload/transformation/ 
      const transformationString = transformations.join(',');
      
      // Gérer les URL qui ont déjà des transformations
      if (url.includes('/upload/')) {
        // Vérifier si l'URL a déjà des transformations
        if (url.match(/\/upload\/[a-z0-9_,]+\//i)) {
          // Remplacer les transformations existantes
          return url.replace(/\/upload\/[a-z0-9_,]+\//i, `/upload/${transformationString}/`);
        } else {
          // Ajouter de nouvelles transformations
          return url.replace('/upload/', `/upload/${transformationString}/`);
        }
      }
      
      // URL non standard - renvoyer l'original
      return url;
    } catch (error) {
      console.error('Error generating optimized image URL:', error);
      return url;
    }
  }
  
  /**
   * Ajoute un paramètre de timestamp à une URL Cloudinary pour éviter la mise en cache
   * @param url L'URL Cloudinary
   * @returns L'URL avec un timestamp
   */
  export function addCacheBustingToUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return url;
    }
    
    const timestamp = Date.now();
    if (url.includes('?')) {
      return `${url}&t=${timestamp}`;
    } else {
      return `${url}?t=${timestamp}`;
    }
  }