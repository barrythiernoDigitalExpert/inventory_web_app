'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

interface ImageWithDescription {
  dataUrl: string;
  description: string;
  file: File;
}

interface ImageUploadProps {
  roomName: string;
  onUpload: (images: { dataUrl: string; description: string; file: File }[]) => Promise<void>;
  generateDescription?: (imageUrl: string, roomName: string) => Promise<string>;
}

export default function ImageUploadComponent({ roomName, onUpload, generateDescription }: ImageUploadProps) {
  const [images, setImages] = useState<ImageWithDescription[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newImages: ImageWithDescription[] = [];
    const files = Array.from(e.target.files);
    
    // Process each file
    for (const file of files) {
      // Read the file as a data URL
      const dataUrl = await readFileAsDataURL(file);
      
      // Generate a description if the function is provided
      let description = '';
      if (generateDescription) {
        try {
          description = await generateDescription(dataUrl, roomName);
        } catch (error) {
          console.error('Error generating description:', error);
          description = `Item in ${roomName}`;
        }
      }
      
      newImages.push({
        dataUrl,
        description,
        file
      });
    }
    
    setImages([...images, ...newImages]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const updateDescription = (index: number, description: string) => {
    const updatedImages = [...images];
    updatedImages[index].description = description;
    setImages(updatedImages);
  };
  
  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };
  
  const handleUpload = async () => {
    if (images.length === 0) return;
    
    setIsUploading(true);
    try {
      await onUpload(images);
      setImages([]);
      toast.success(`${images.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="bg-[#2D2D2D] rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#FFFFFF] font-medium">Add images to {roomName}</h3>
        <label className="cursor-pointer bg-[#1E1E1E] hover:bg-[#3D3D3D] text-[#FFFFFF] px-3 py-1 rounded-full text-sm flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1 text-[#D4A017]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Select Images
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
        </label>
      </div>
      
      {images.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div key={index} className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={image.dataUrl}
                    alt={`Preview ${index}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-t-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <label className="block text-[#CCCCCC] text-xs mb-1">Description</label>
                  <textarea
                    value={image.description}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    className="w-full p-2 rounded-md bg-[#2D2D2D] border border-[#3D3D3D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF] text-sm min-h-[60px]"
                    placeholder={`Describe this image of ${roomName}`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading || images.length === 0}
              className={`px-4 py-2 rounded-md ${
                isUploading || images.length === 0
                  ? 'bg-[#2D2D2D] text-[#CCCCCC] cursor-not-allowed'
                  : 'bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload All Images'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 bg-[#1E1E1E]/50 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-[#CCCCCC] mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-[#CCCCCC] text-sm">Select images to add to this room</p>
        </div>
      )}
    </div>
  );
}