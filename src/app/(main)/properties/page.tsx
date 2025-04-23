'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createProperty, fetchProperties, Property } from '@/lib/services/propertyService';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('reference');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // States for property addition modal
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedPropertyImage, setUploadedPropertyImage] = useState<string | null>(null);
  const [propertyRef, setPropertyRef] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<{
    code: string;
    name: string;
    type: string;
    images: string[];
  }[]>([]);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(-1);
  const [bedroomCount, setBedroomCount] = useState(1);
  const [bathroomCount, setBathroomCount] = useState(1);
  const [customRoomName, setCustomRoomName] = useState('');
  const [customRoomType, setCustomRoomType] = useState('');
  
  // States for image manipulation
  const [selectedImage, setSelectedImage] = useState<{roomIndex: number, imageIndex: number} | null>(null);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });

  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [imageRotation, setImageRotation] = useState(0);
const [cropMode, setCropMode] = useState(false);
const [cropRect, setCropRect] = useState({ x: 20, y: 20, width: 200, height: 200 });
const [isDragging, setIsDragging] = useState(false);
const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
const [brightness, setBrightness] = useState(100);
const [contrast, setContrast] = useState(100);
const [showAdjustControls, setShowAdjustControls] = useState(false);
const imageEditorRef = useRef<HTMLDivElement>(null);

  // Room categories
  const roomCategories = [
    '01 - Entrance hall',
    '02 - Living room',
    '03 - Dining room',
    '04 - Kitchen',
    '05 - Hallway(s)',
    '06 - Staircase(s)',
    '07 - Bedroom',
    '08 - Bathroom',
    '09 - Washroom',
    '10 - Office',
    '11 - Laundry / Utility room',
    '12 - Garage',
    '13 - Basement',
    '14 - Gym',
    '15 - Cinema room',
    '16 - Games room',
    '17 - Wine cellar',
    '18 - Outdoor / Garden furniture',
    '19 - Balcony',
    '20 - Terrace',
    '21 - Pool house',
    '22 - Machine Room',
    '23 - Annex'
  ];

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, []);

  useEffect(() => {
    if (cropMode && imageEditorRef.current) {
      // Initialize crop area at the center with a reasonable size
      const rect = imageEditorRef.current.getBoundingClientRect();
      const centerX = rect.width / 4;
      const centerY = rect.height / 4;
      const size = Math.min(rect.width, rect.height) / 2;
      
      setCropRect({
        x: centerX,
        y: centerY,
        width: size,
        height: size
      });
    }
  }, [cropMode]);

  // Initialize rooms when modal is opened
  useEffect(() => {
    if (showAddPropertyModal && currentStep === 1) {
      // Reset and prepare initial state
      setPropertyRef('');
      setUploadedPropertyImage(null);
      setSelectedRooms([]);
      setBedroomCount(1);
      setBathroomCount(1);
    }
    
    // Pre-fill all standard rooms when moving to step 2
    if (showAddPropertyModal && currentStep === 2 && selectedRooms.length === 0) {
      const standardRooms = roomCategories
        .filter(cat => !cat.startsWith('07 -') && !cat.startsWith('08 -'))
        .map(category => {
          const categoryCode = category.split(' - ')[0];
          const categoryName = category.split(' - ')[1];
          return {
            code: categoryCode,
            name: categoryName,
            type: 'standard',
            images: []
          };
        });
      
      setSelectedRooms(standardRooms);
    }
  }, [showAddPropertyModal, currentStep]);

  // Filter and sort properties
  const filteredAndSortedProperties = [...properties]
    .filter(property => 
      property.reference.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const valueA = sortBy === 'createdAt' ? new Date(a[sortBy]) : a[sortBy];
      const valueB = sortBy === 'createdAt' ? new Date(b[sortBy]) : b[sortBy];
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field : any) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Function to handle property image upload
  const handlePropertyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedPropertyImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to add a bedroom
  const addBedroom = () => {
    const newRoom = {
      code: `07.${bedroomCount}`,
      name: `Bedroom ${bedroomCount}`,
      type: 'bedroom',
      images: []
    };
    setSelectedRooms([...selectedRooms, newRoom]);
    setBedroomCount(bedroomCount + 1);
  };

  // Function to add a bathroom
  const addBathroom = () => {
    const newRoom = {
      code: `08.${bathroomCount}`,
      name: `Bathroom ${bathroomCount}`,
      type: 'bathroom',
      images: []
    };
    setSelectedRooms([...selectedRooms, newRoom]);
    setBathroomCount(bathroomCount + 1);
  };

  // Function to add a custom room
  const addCustomRoom = () => {
    if (customRoomName) {
      const newCode = `00.${Math.floor(Math.random() * 100)}`; // Generic code for custom room
      const newRoom = {
        code: newCode,
        name: customRoomName,
        type: 'custom',
        images: []
      };
      
      setSelectedRooms([...selectedRooms, newRoom]);
      setCustomRoomName('');
    }
  };

  // Function to add images to a room
  const handleRoomImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && selectedRoomIndex >= 0) {
      const newImages: string[] = [];
      
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          newImages.push(reader.result as string);
          
          if (newImages.length === e.target.files!.length) {
            const updatedRooms = [...selectedRooms];
            updatedRooms[selectedRoomIndex].images = [
              ...updatedRooms[selectedRoomIndex].images,
              ...newImages
            ];
            setSelectedRooms(updatedRooms);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Functions for image manipulation
  const rotateImage = (direction: 'left' | 'right') => {
    if (selectedImage === null) return;
    
    const newRotation = direction === 'right' 
      ? (imageRotation + 90) % 360 
      : (imageRotation - 90 + 360) % 360;
    
    setImageRotation(newRotation);
    
    // Apply rotation to the image
    const { roomIndex, imageIndex } = selectedImage;
    if (roomIndex >= 0 && imageIndex >= 0) {
      // In a real application, you would manipulate the image here
      // For this example, we'll just simulate the rotation
      console.log(`Image ${imageIndex} of room ${roomIndex} rotated to ${newRotation}°`);
    }
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = imageEditorRef.current.getBoundingClientRect();
    setDragStartPos({
      x: e.clientX - rect.left - cropRect.x,
      y: e.clientY - rect.top - cropRect.y
    });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current || !isDragging) return;
    
    e.preventDefault();
    const rect = imageEditorRef.current.getBoundingClientRect();
    const maxX = rect.width - cropRect.width;
    const maxY = rect.height - cropRect.height;
    
    let newX = e.clientX - rect.left - dragStartPos.x;
    let newY = e.clientY - rect.top - dragStartPos.y;
    
    // Limit to container
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setCropRect({
      ...cropRect,
      x: newX,
      y: newY
    });
  };
  
  const handleCropMouseUp = () => {
    setIsDragging(false);
  };

  const handleResizeCrop = (direction: string, e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = imageEditorRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Resize function to apply during mouse movement
    const resize = (e: MouseEvent) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      let newRect = { ...cropRect };
      
      switch (direction) {
        case 'topLeft':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.width - 50),
            y: Math.min(y, cropRect.y + cropRect.height - 50),
            width: cropRect.x + cropRect.width - Math.min(x, cropRect.x + cropRect.width - 50),
            height: cropRect.y + cropRect.height - Math.min(y, cropRect.y + cropRect.height - 50)
          };
          break;
        case 'topRight':
          newRect = {
            x: cropRect.x,
            y: Math.min(y, cropRect.y + cropRect.height - 50),
            width: Math.max(50, x - cropRect.x),
            height: cropRect.y + cropRect.height - Math.min(y, cropRect.y + cropRect.height - 50)
          };
          break;
        case 'bottomLeft':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.width - 50),
            y: cropRect.y,
            width: cropRect.x + cropRect.width - Math.min(x, cropRect.x + cropRect.width - 50),
            height: Math.max(50, y - cropRect.y)
          };
          break;
        case 'bottomRight':
          newRect = {
            x: cropRect.x,
            y: cropRect.y,
            width: Math.max(50, x - cropRect.x),
            height: Math.max(50, y - cropRect.y)
          };
          break;
      }
      
      // Keep rectangle within bounds
      if (newRect.x < 0) {
        newRect.width += newRect.x;
        newRect.x = 0;
      }
      if (newRect.y < 0) {
        newRect.height += newRect.y;
        newRect.y = 0;
      }
      if (newRect.x + newRect.width > rect.width) {
        newRect.width = rect.width - newRect.x;
      }
      if (newRect.y + newRect.height > rect.height) {
        newRect.height = rect.height - newRect.y;
      }
      
      setCropRect(newRect);
    };
    
    const cleanUp = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', cleanUp);
    };
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', cleanUp);
  };
  



  const toggleCropMode = () => {
    setCropMode(!cropMode);
    if (cropMode) {
      // Apply crop if deactivating mode
      applyCrop();
    } else {
      // Reset positions if activating mode
      setCropStart({ x: 0, y: 0 });
      setCropEnd({ x: 0, y: 0 });
    }
  };

  const handleCropStart = (e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current) return;
    
    const rect = imageEditorRef.current.getBoundingClientRect();
    setCropStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCropMove = (e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current || e.buttons !== 1) return;
    
    const rect = imageEditorRef.current.getBoundingClientRect();
    setCropEnd({
      x: Math.min(Math.max(0, e.clientX - rect.left), rect.width),
      y: Math.min(Math.max(0, e.clientY - rect.top), rect.height)
    });
  };

  const handleCropEnd = () => {
    if (cropMode && cropStart.x !== cropEnd.x && cropStart.y !== cropEnd.y) {
      // Here we would normally finalize the crop
      console.log("Crop dimensions:", {
        x: Math.min(cropStart.x, cropEnd.x),
        y: Math.min(cropStart.y, cropEnd.y),
        width: Math.abs(cropEnd.x - cropStart.x),
        height: Math.abs(cropEnd.y - cropStart.y)
      });
    }
  };
  
  const applyCrop = () => {
    if (selectedImage === null || !cropMode) {
      setCropMode(false);
      return;
    }
    
    // Ensure this code runs on the client side
    if (typeof window === 'undefined') return;
    
    const applyClientSideCrop = () => {
      try {
        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        const imgElement = new window.Image(); // Use window.Image to avoid error
        
        imgElement.onload = () => {
          // Get editor container dimensions
          const editorElement = imageEditorRef.current;
          if (!editorElement) return;
          
          const editorRect = editorElement.getBoundingClientRect();
          
          // Calculate ratios between actual image and display
          const displayWidth = editorRect.width;
          const displayHeight = editorRect.height;
          
          // Calculate ratio to fit image to container
          const imgRatio = imgElement.width / imgElement.height;
          const containerRatio = displayWidth / displayHeight;
          
          // Determine actual dimensions and position of image in element
          let imgWidth, imgHeight, offsetX, offsetY;
          
          if (imgRatio > containerRatio) {
            // Image is wider than container
            imgWidth = displayWidth;
            imgHeight = displayWidth / imgRatio;
            offsetX = 0;
            offsetY = (displayHeight - imgHeight) / 2;
          } else {
            // Image is taller than container
            imgHeight = displayHeight;
            imgWidth = displayHeight * imgRatio;
            offsetX = (displayWidth - imgWidth) / 2;
            offsetY = 0;
          }
          
          // Calculate actual crop coordinates
          const scaleX = imgElement.width / imgWidth;
          const scaleY = imgElement.height / imgHeight;
          
          const cropX = (cropRect.x - offsetX) * scaleX;
          const cropY = (cropRect.y - offsetY) * scaleY;
          const cropWidth = cropRect.width * scaleX;
          const cropHeight = cropRect.height * scaleY;
          
          // Configure canvas for cropping
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          
          // Apply rotation if needed
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Handle rotation if necessary
          if (imageRotation !== 0) {
            // Adjust canvas dimensions to account for rotation
            if (imageRotation === 90 || imageRotation === 270) {
              canvas.width = cropHeight;
              canvas.height = cropWidth;
            }
            
            // Move context to center of canvas
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((imageRotation * Math.PI) / 180);
            
            // Draw cropped and rotated image
            const drawX = imageRotation === 90 ? -cropHeight/2 : 
                           imageRotation === 270 ? -cropHeight/2 : -cropWidth/2;
            const drawY = imageRotation === 90 ? -cropWidth/2 : 
                           imageRotation === 270 ? -cropWidth/2 : -cropHeight/2;
            const drawWidth = imageRotation === 90 || imageRotation === 270 ? cropHeight : cropWidth;
            const drawHeight = imageRotation === 90 || imageRotation === 270 ? cropWidth : cropHeight;
            
            ctx.drawImage(
              imgElement,
              cropX, cropY, cropWidth, cropHeight,
              drawX, drawY, drawWidth, drawHeight
            );
            
            ctx.restore();
          } else {
            // Without rotation, simply draw the cropped part
            ctx.drawImage(
              imgElement,
              cropX, cropY, cropWidth, cropHeight,
              0, 0, cropWidth, cropHeight
            );
          }
          
          // Convert canvas to dataURL
          const croppedDataURL = canvas.toDataURL('image/jpeg', 0.9);
          
          // Update image in state
          const updatedRooms = [...selectedRooms];
          updatedRooms[selectedImage.roomIndex].images[selectedImage.imageIndex] = croppedDataURL;
          setSelectedRooms(updatedRooms);
          
          // Reset rotation state
          setImageRotation(0);
        };
        
        // Load source image
        imgElement.src = selectedRooms[selectedImage.roomIndex].images[selectedImage.imageIndex];
        
      } catch (error) {
        console.error("Error during cropping:", error);
      }
      
      // Disable crop mode in all cases
      setCropMode(false);
    };
    
    // Execute with a small delay to ensure everything is ready
    setTimeout(applyClientSideCrop, 0);
  };
  

  const closeImageEditor = () => {
    setSelectedImage(null);
    setImageRotation(0);
    setCropMode(false);
    setShowAdjustControls(false);
    setBrightness(100);
    setContrast(100);
    setIsDragging(false);
    setCropRect({ x: 20, y: 20, width: 200, height: 200 });
  };

  const applyAdjustments = () => {
    if (selectedImage === null) return;
    
    // Ensure this code runs on the client side
    if (typeof window === 'undefined') return;
    
    const applyClientSideAdjustments = () => {
      try {
        // Create canvas to apply filters
        const canvas = document.createElement('canvas');
        const imgElement = new window.Image(); // Use window.Image to avoid error
        
        imgElement.onload = () => {
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Apply CSS filters via a temporary second canvas
          // This approach is necessary because ctx.filter isn't supported everywhere
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;
          
          // First draw the original image
          tempCtx.drawImage(imgElement, 0, 0);
          
          // Apply filters by manipulating pixel data
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          
          // Apply brightness/contrast
          const brightnessRatio = brightness / 100;
          const contrastFactor = (contrast / 100) * 2 - 1; // -1 to 1
          
          for (let i = 0; i < data.length; i += 4) {
            // Brightness
            data[i] = data[i] * brightnessRatio;     // R
            data[i + 1] = data[i + 1] * brightnessRatio; // G
            data[i + 2] = data[i + 2] * brightnessRatio; // B
            
            // Contrast
            if (contrastFactor !== 0) {
              data[i] = Math.min(255, Math.max(0, (data[i] - 128) * (contrastFactor + 1) + 128));
              data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * (contrastFactor + 1) + 128));
              data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * (contrastFactor + 1) + 128));
            }
          }
          
          // Update image with applied filters
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to dataURL
          const adjustedDataURL = canvas.toDataURL('image/jpeg', 0.9);
          
          // Update image in state
          const updatedRooms = [...selectedRooms];
          updatedRooms[selectedImage.roomIndex].images[selectedImage.imageIndex] = adjustedDataURL;
          setSelectedRooms(updatedRooms);
        };
        
        // Load source image
        imgElement.src = selectedRooms[selectedImage.roomIndex].images[selectedImage.imageIndex];
        
      } catch (error) {
        console.error("Error during adjustment:", error);
      }
      
      // Hide adjustment controls
      setShowAdjustControls(false);
      // Reset values for next use
      setBrightness(100);
      setContrast(100);
    };
    
    // Execute with a small delay to ensure everything is ready
    setTimeout(applyClientSideAdjustments, 0);
  }; 


  const handleSaveProperty = async () => {
    try {
      if (!propertyRef || !uploadedPropertyImage) {
        alert("Please fill in all required fields");
        return;
      }
      
      // Prepare data
      const propertyData = {
        reference: "EAV-" + propertyRef,
        image: uploadedPropertyImage,
        rooms: selectedRooms.map(room => ({
          code: room.code,
          name: room.name,
          // Don't include the type field that doesn't exist in the schema
          images: room.images
        }))
      };
      
      // Show loading indicator if needed
      setIsLoading?.(true);
      
      // API call
      const result = await createProperty(propertyData);
      
      if (result.success) {
        alert("Reference added successfully!");
        
        // Reset form
        setCurrentStep(1);
        setUploadedPropertyImage(null);
        setPropertyRef('');
        setSelectedRooms([]);
        setSelectedRoomIndex(-1);
        setBedroomCount(1);
        setBathroomCount(1);
        setShowAddPropertyModal(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred: " + (error as Error).message);
    } finally {
      setIsLoading?.(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#D4A017]">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with title and filtering options */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-6 shadow-lg mb-6 border-l-4 border-[#D4A017]">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-[#FFFFFF]">Inventory Management</h1>
          <div className="flex space-x-4">
            <div className="flex space-x-2">
            <button 
              onClick={() => setShowAddPropertyModal(true)} 
              className="btn btn-primary flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Reference
            </button>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2.5 rounded-md ${viewMode === 'grid' ? 'bg-[#D4A017] text-[#1E1E1E]' : 'bg-[#1E1E1E] text-[#D4A017] border border-[#D4A017]/30'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2.5 rounded-md ${viewMode === 'list' ? 'bg-[#D4A017] text-[#1E1E1E]' : 'bg-[#1E1E1E] text-[#D4A017] border border-[#D4A017]/30'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1E1E1E] rounded-lg p-5 shadow-lg mb-6 border border-[#D4A017]/10">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-[#D4A017]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input 
              type="search" 
              className="block w-full p-3 pl-10 text-sm rounded-lg bg-[#1E1E1E] border border-[#D4A017]/20 focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]" 
              placeholder="Search for a property..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => toggleSort('reference')} 
              className={`px-3 py-2 rounded-md text-sm ${
                sortBy === 'reference' 
                  ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30' 
                  : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-[#D4A017]/20'
              }`}
            >
              Reference {sortBy === 'reference' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => toggleSort('createdAt')} 
              className={`px-3 py-2 rounded-md text-sm ${
                sortBy === 'createdAt' 
                  ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30' 
                  : 'bg-[#1E1E1E] text-[#CCCCCC] border border-transparent hover:border-[#D4A017]/20'
              }`}
            >
              Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Properties display - Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProperties.length > 0 ? (
            filteredAndSortedProperties.map((property) => (
              <div key={property.id} className="bg-[#2D2D2D] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <Link href={`/properties/${property.id}`} className="block relative h-48 w-full">
                  <Image
                    src={property.image || '/images/property-placeholder.jpg'}
                    alt={property.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
                  />
                  <div className="absolute top-0 right-0 m-2">
                    <span className="bg-[#D4A017] text-[#1E1E1E] text-xs font-bold px-2 py-1 rounded">
                      {property.totalItems || 0} items
                    </span>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-[#CCCCCC] mb-1">{property.reference}</div>
                      <h3 className="text-lg font-bold text-[#FFFFFF] mb-1 hover:text-[#D4A017] transition-colors">
                        <Link href={`/properties/${property.id}`}>
                          {property.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-[#CCCCCC] mb-3">{property.address}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-[#CCCCCC]">
                      Created on: {new Date(property.createdAt).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={() => alert(`Generating PDF for property ${property.id}`)}
                      className="text-[#D4A017] hover:text-[#E6B52C] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 8v-3M14 8v-3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-64 bg-[#2D2D2D] rounded-lg">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CCCCCC] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#CCCCCC]">No properties match your search.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Properties display - List Mode */}
      {viewMode === 'list' && (
        <div className="bg-[#2D2D2D] rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#1E1E1E]">
              <thead className="bg-[#1E1E1E]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider">
                    Property
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider">
                    Created Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#CCCCCC] uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#CCCCCC] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E]">
                {filteredAndSortedProperties.length > 0 ? (
                  filteredAndSortedProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={property.image || '/images/property-placeholder.jpg'}
                              alt={property.name}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#FFFFFF]">
                              <Link href={`/properties/${property.id}`} className="hover:text-[#D4A017] transition-colors">
                                {property.name}
                              </Link>
                            </div>
                            <div className="text-xs text-[#CCCCCC]">{property.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CCCCCC]">
                        {property.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CCCCCC]">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-[#D4A017]/20 text-[#D4A017] rounded-full">
                          {property.totalItems || 0} items
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            href={`/properties/${property.id}`}
                            className="text-[#CCCCCC] hover:text-[#FFFFFF] transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button 
                            onClick={() => alert(`Generating PDF for property ${property.id}`)}
                            className="text-[#CCCCCC] hover:text-[#D4A017] transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 8v-3M14 8v-3" />
                              </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-[#CCCCCC]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-[#CCCCCC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No properties match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property addition modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#FFFFFF]">
                {currentStep === 1 ? "Add Reference - Step 1" : 
                 currentStep === 2 ? "Add Reference - Step 2" : 
                 "Add Reference - Step 3"}
              </h2>
              <button 
                onClick={() => setShowAddPropertyModal(false)}
                className="text-[#CCCCCC] hover:text-[#FFFFFF]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Step 1 content: Basic Information */}
            {currentStep === 1 && (
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-[#CCCCCC] mb-4">Let's start by adding basic information about your property</p>
                  
                  {/* Image upload */}
                  <div className="mb-4">
                    <label className="block text-[#FFFFFF] mb-2 font-medium">Property Image</label>
                    <div className="flex items-center space-x-4">
                      <div className={`w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center relative ${uploadedPropertyImage ? 'border-[#D4A017]' : 'border-[#CCCCCC]'}`}>
                        {uploadedPropertyImage ? (
                          <div className="w-full h-full relative">
                            <Image 
                              src={uploadedPropertyImage} 
                              alt="Property" 
                              fill 
                              style={{ objectFit: 'cover' }} 
                              className="rounded-lg"
                            />
                            <button 
                              onClick={() => setUploadedPropertyImage(null)}
                              className="absolute top-1 right-1 bg-[#1E1E1E] rounded-full p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer text-center p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-[#CCCCCC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-[#CCCCCC] mt-2 block">Click to add</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handlePropertyImageUpload}
                            />
                          </label>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#CCCCCC]">Add a main image for this property</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reference */}
                  <div className="mb-4">
                    <label className="block text-[#FFFFFF] mb-2 font-medium">Reference</label>
                    <div className="flex">
                      <div className="bg-[#2D2D2D] px-3 py-2 rounded-l-md text-[#D4A017] border-y border-l border-[#2D2D2D]">
                        EAV-
                      </div>
                      <input
                        type="text"
                        value={propertyRef}
                        onChange={(e) => setPropertyRef(e.target.value)}
                        className="w-full p-2 rounded-r-md bg-[#2D2D2D] border border-[#2D2D2D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                        placeholder="12345"
                      />
                    </div>
                    <p className="text-xs text-[#CCCCCC] mt-1">Enter only the numerical part of the reference</p>
                  </div>
                </div>
                
                {/* Navigation buttons */}
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowAddPropertyModal(false)}
                    className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#1E1E1E]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!uploadedPropertyImage || !propertyRef}
                    className={`px-4 py-2 rounded-md ${
                      !uploadedPropertyImage || !propertyRef
                        ? 'bg-[#2D2D2D] text-[#CCCCCC] cursor-not-allowed'
                        : 'bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2 content: Room Selection */}
            {currentStep === 2 && (
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-[#CCCCCC] mb-4">All standard rooms are automatically included. You can add bedrooms, bathrooms, or custom rooms.</p>
                  
                  {/* Info with icon */}
                  <div className="bg-[#2D2D2D] rounded-lg p-3 mb-4 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D4A017] mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-[#CCCCCC]">The 21 standard rooms (Entrance, Living Room, Kitchen, etc.) are already pre-selected. You will be able to add images for each of them in the next step.</p>
                  </div>
                  
                  {/* Add bedrooms and bathrooms */}
                  <div className="bg-[#2D2D2D] rounded-lg p-4 mb-4">
                    <h3 className="text-[#FFFFFF] font-medium mb-3">Add bedrooms and bathrooms</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bedrooms */}
                      <div>
                        <label className="text-sm text-[#CCCCCC] mb-2 block">Bedrooms</label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: bedroomCount - 1 }).map((_, i) => (
                            <div key={`bedroom-${i+1}`} className="bg-[#1E1E1E] px-3 py-1 rounded-full text-sm text-[#FFFFFF]">
                              Bedroom {i+1}
                            </div>
                          ))}
                          <button 
                            onClick={addBedroom}
                            className="bg-[#1E1E1E] hover:bg-[#2D2D2D] text-[#FFFFFF] px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Bedroom {bedroomCount}
                          </button>
                        </div>
                      </div>
                      
                      {/* Bathrooms */}
                      <div>
                        <label className="text-sm text-[#CCCCCC] mb-2 block">Bathrooms</label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: bathroomCount - 1 }).map((_, i) => (
                            <div key={`bathroom-${i+1}`} className="bg-[#1E1E1E] px-3 py-1 rounded-full text-sm text-[#FFFFFF]">
                              Bathroom {i+1}
                            </div>
                          ))}
                          <button 
                            onClick={addBathroom}
                            className="bg-[#1E1E1E] hover:bg-[#2D2D2D] text-[#FFFFFF] px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Bathroom {bathroomCount}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Custom room */}
                  <div className="bg-[#2D2D2D] rounded-lg p-4">
                    <h3 className="text-[#FFFFFF] font-medium mb-3">Add a custom room</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-[#CCCCCC] mb-2 block">Room name</label>
                        <input
                          type="text"
                          value={customRoomName}
                          onChange={(e) => setCustomRoomName(e.target.value)}
                          className="w-full p-2 rounded-md bg-[#1E1E1E] border border-[#1E1E1E] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                          placeholder="Ex: Children's playroom"
                        />
                      </div>
                     
                    </div>
                    
                    <button 
                      onClick={addCustomRoom}
                      disabled={!customRoomName}
                      className={`w-full py-2 rounded-md ${
                        !customRoomName 
                          ? 'bg-[#1E1E1E] text-[#CCCCCC] cursor-not-allowed'
                          : 'bg-[#D4A017]/20 text-[#D4A017] hover:bg-[#D4A017]/30'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add this room
                      </div>
                    </button>
                  </div>
                  
                  {/* List of added custom rooms */}
                  {selectedRooms.filter(room => room.type === 'custom').length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-[#FFFFFF] font-medium mb-2">Added custom rooms:</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedRooms.filter(room => room.type === 'custom').map((room, index) => (
                          <div 
                            key={`custom-${index}`}
                            className="bg-[#2D2D2D] rounded-lg p-2 flex flex-col items-center text-center"
                          >
                            <span className="text-xs text-[#D4A017]">{room.code}</span>
                            <span className="text-sm text-[#FFFFFF]">{room.name}</span>
                            <button 
                              onClick={() => {
                                const roomIndex = selectedRooms.findIndex(r => r.code === room.code);
                                if (roomIndex >= 0) {
                                  const newRooms = [...selectedRooms];
                                  newRooms.splice(roomIndex, 1);
                                  setSelectedRooms(newRooms);
                                }
                              }}
                              className="text-[#CCCCCC] hover:text-[#D4A017] mt-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Navigation buttons */}
                <div className="flex justify-between">
                  <button 
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#1E1E1E]"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 rounded-md bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 3 content: Adding images for each room */}
            {currentStep === 3 && (
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-[#CCCCCC] mb-4">Add images for each room</p>
                  
                  {/* Active room selection */}
                  <div className="mb-4">
                    <label className="block text-[#FFFFFF] mb-2 font-medium">Select a room</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {selectedRooms.map((room, index) => (
                        <button 
                          key={room.code + index}
                          onClick={() => setSelectedRoomIndex(index)}
                          className={`p-2 rounded-lg ${
                            selectedRoomIndex === index 
                              ? 'bg-[#D4A017]/20 border border-[#D4A017] text-[#D4A017]' 
                              : room.images.length > 0
                                ? 'bg-[#2D2D2D] border border-green-600/30 text-[#FFFFFF]'
                                : 'bg-[#2D2D2D] border border-transparent text-[#FFFFFF]'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xs">{room.code}</span>
                            <span className="text-sm font-medium">{room.name}</span>
                            {room.images.length > 0 && (
                              <span className="text-xs mt-1 text-green-500">{room.images.length} images</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image upload for selected room */}
                  {selectedRoomIndex >= 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[#FFFFFF] font-medium">
                          Images for {selectedRooms[selectedRoomIndex].name}
                        </h3>
                        <label className="cursor-pointer bg-[#1E1E1E] hover:bg-[#2D2D2D] text-[#FFFFFF] px-3 py-1 rounded-full text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add images
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            multiple
                            onChange={handleRoomImagesUpload}
                          />
                        </label>
                      </div>
                      
                      {/* Images display */}
                      {selectedRooms[selectedRoomIndex].images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {selectedRooms[selectedRoomIndex].images.map((image, imgIndex) => (
                            <div key={imgIndex} className="aspect-square relative rounded-lg overflow-hidden group">
                              <Image 
                                src={image} 
                                alt={`${selectedRooms[selectedRoomIndex].name} ${imgIndex + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                              {/* Overlay with edit buttons */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex space-x-1">
                                  {/* Edit button */}
                                  <button 
                                    onClick={() => setSelectedImage({roomIndex: selectedRoomIndex, imageIndex: imgIndex})}
                                    className="bg-[#1E1E1E] rounded-full p-2 text-[#D4A017] hover:bg-[#2D2D2D]"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  {/* Delete button */}
                                  <button 
                                    onClick={() => {
                                      const updatedRooms = [...selectedRooms];
                                      updatedRooms[selectedRoomIndex].images.splice(imgIndex, 1);
                                      setSelectedRooms(updatedRooms);
                                    }}
                                    className="bg-[#1E1E1E] rounded-full p-2 text-red-500 hover:bg-[#2D2D2D]"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#1E1E1E] rounded-lg p-6 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[#CCCCCC] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-[#CCCCCC]">No images for this room. Click "Add images" to begin.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-[#FFFFFF] font-medium">Progress</h3>
                      <span className="text-sm text-[#CCCCCC]">
                        {selectedRooms.filter(room => room.images.length > 0).length} / {selectedRooms.length} rooms with images
                      </span>
                    </div>
                    <div className="w-full bg-[#1E1E1E] rounded-full h-2">
                      <div 
                        className="bg-[#D4A017] h-2 rounded-full" 
                        style={{ 
                          width: `${(selectedRooms.filter(room => room.images.length > 0).length / selectedRooms.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Navigation buttons */}
                <div className="flex justify-between">
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#1E1E1E]"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={handleSaveProperty}
                    className="px-4 py-2 rounded-md bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]"
                  >
                    Finalize and Save
                  </button>
                </div>
              </div>
            )}
            
            {/* Image editor modal */}
            {selectedImage !== null && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div className="bg-[#1E1E1E] rounded-lg max-w-3xl w-full">
      {/* Image editor header */}
      <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#FFFFFF]">Edit Image</h2>
        <button 
          onClick={closeImageEditor}
          className="text-[#CCCCCC] hover:text-[#FFFFFF]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Image editor content */}
      <div className="p-4">
        {/* Image preview with filters/cropping */}
        <div 
          ref={imageEditorRef}
          className="relative w-full h-72 mb-4 bg-[#2D2D2D] rounded-lg overflow-hidden"
          style={{ 
            touchAction: cropMode ? 'none' : 'auto' 
          }}
        >
          {/* Main image */}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              filter: showAdjustControls ? `brightness(${brightness}%) contrast(${contrast}%)` : 'none',
              transform: `rotate(${imageRotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          >
            <img 
              src={selectedRooms[selectedImage.roomIndex].images[selectedImage.imageIndex]} 
              alt="Image to edit" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {/* Crop interface */}
          {cropMode && (
            <>
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50"></div>
              
              {/* Crop area */}
              <div
                className="absolute border-2 border-white cursor-move"
                style={{
                  left: `${cropRect.x}px`,
                  top: `${cropRect.y}px`,
                  width: `${cropRect.width}px`,
                  height: `${cropRect.height}px`,
                }}
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              >
                {/* Resize handles */}
                <div 
                  className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize z-10"
                  onMouseDown={(e) => handleResizeCrop('topLeft', e)}
                ></div>
                <div 
                  className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full cursor-nesw-resize z-10"
                  onMouseDown={(e) => handleResizeCrop('topRight', e)}
                ></div>
                <div 
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full cursor-nesw-resize z-10"
                  onMouseDown={(e) => handleResizeCrop('bottomLeft', e)}
                ></div>
                <div 
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize z-10"
                  onMouseDown={(e) => handleResizeCrop('bottomRight', e)}
                ></div>
              </div>
            </>
          )}
        </div>
        
        {/* Adjustment controls */}
        {showAdjustControls && (
          <div className="mb-4 bg-[#2D2D2D] p-3 rounded-lg">
            <div className="mb-2">
              <div className="flex justify-between text-sm text-[#FFFFFF] mb-1">
                <span>Brightness</span>
                <span>{brightness}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={brightness} 
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #1E1E1E, #D4A017)',
                  accentColor: '#D4A017'
                }}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm text-[#FFFFFF] mb-1">
                <span>Contrast</span>
                <span>{contrast}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={contrast} 
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #1E1E1E, #D4A017)',
                  accentColor: '#D4A017'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Editing tools */}
        <div className="flex flex-wrap gap-2">
          {/* Rotate left */}
          <button 
            onClick={() => rotateImage('left')}
            className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#FFFFFF] px-3 py-2 rounded-md text-sm flex items-center"
            disabled={cropMode || showAdjustControls}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Rotate Left
          </button>
          
          {/* Rotate right */}
          <button 
            onClick={() => rotateImage('right')}
            className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#FFFFFF] px-3 py-2 rounded-md text-sm flex items-center"
            disabled={cropMode || showAdjustControls}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            Rotate Right
          </button>
          
          {/* Crop */}
          <button 
            onClick={() => {
              if (cropMode) {
                applyCrop();
              } else {
                setCropMode(true);
                setShowAdjustControls(false);
              }
            }}
            className={`${
              cropMode 
                ? 'bg-[#D4A017] text-[#1E1E1E]'
                : 'bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#FFFFFF]'
            } px-3 py-2 rounded-md text-sm flex items-center`}
            disabled={showAdjustControls}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {cropMode ? 'Apply' : 'Crop'}
          </button>
          
          {/* Adjust */}
          <button 
            onClick={() => {
              if (showAdjustControls) {
                applyAdjustments();
              } else {
                setShowAdjustControls(true);
                setCropMode(false);
              }
            }}
            className={`${
              showAdjustControls 
                ? 'bg-[#D4A017] text-[#1E1E1E]'
                : 'bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#FFFFFF]'
            } px-3 py-2 rounded-md text-sm flex items-center`}
            disabled={cropMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {showAdjustControls ? 'Apply' : 'Adjust'}
          </button>
        </div>
      </div>
      
      {/* Image editor footer */}
      <div className="p-4 border-t border-[#2D2D2D] flex justify-end space-x-3">
        <button 
          onClick={closeImageEditor}
          className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#1E1E1E]"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            if (cropMode) {
              applyCrop();
            } else if (showAdjustControls) {
              applyAdjustments();
            } else {
              closeImageEditor();
            }
          }}
          className="px-4 py-2 rounded-md bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]"
        >
          {cropMode ? 'Apply Crop' : 
           showAdjustControls ? 'Apply Adjustments' : 
           'Finish'}
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}