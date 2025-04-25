// src/app/(main)/properties/[id]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPropertyById, fetchPropertyRooms, fetchRoomItems, Property } from '@/lib/services/propertyService';
import { fetchRoomImages, RoomImage, getPlaceholderImages } from '@/lib/services/roomImageService';
import { toast } from 'react-hot-toast';

interface Room {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  hasImages?: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  image?: string;
  notes?: string;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomItems, setRoomItems] = useState<InventoryItem[]>([]);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRoomItemsLoading, setIsRoomItemsLoading] = useState(false);
  const [isRoomImagesLoading, setIsRoomImagesLoading] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const { id } = use(params);


  useEffect(() => {
    const loadPropertyDetails = async () => {
      try {
        setIsLoading(true);
        const propertyData = await fetchPropertyById(id);
        setProperty(propertyData);
        
        const roomsData = await fetchPropertyRooms(id);
        
        const sortedRooms = [...roomsData].sort((a, b) => {
          if (a.itemCount !== b.itemCount) {
            return b.itemCount - a.itemCount;
          }
          return a.name.localeCompare(b.name);
        });
        
        setRooms(sortedRooms);
        setFilteredRooms(sortedRooms);
        
        if (sortedRooms.length > 0) {
          setSelectedRoom(sortedRooms[0].id);
        }
      } catch (error) {
        console.error('Error loading property details:', error);
        toast.error('Failed to load property details');
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyDetails();
  }, [id]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchTerm, rooms]);

  useEffect(() => {
    const loadRoomItems = async () => {
      if (!selectedRoom) return;
      
      try {
        setIsRoomItemsLoading(true);
        const roomItemsData = await fetchRoomItems(selectedRoom);
        setRoomItems(roomItemsData);
      } catch (error) {
        console.error('Error loading room items:', error);
        toast.error('Failed to load room items');
        setRoomItems([]);
      } finally {
        setIsRoomItemsLoading(false);
      }
    };

    loadRoomItems();
  }, [selectedRoom, id]);

  useEffect(() => {
    const loadRoomImages = async () => {
      if (!selectedRoom) return;
      
      try {
        setIsRoomImagesLoading(true);
        const roomImagesData = await fetchRoomImages(id, selectedRoom);
        
        if (roomImagesData && roomImagesData.length > 0) {
          setRoomImages(roomImagesData);
        } else {
          setRoomImages([]);
        }
        
        setCurrentImageIndex(0);
      } catch (error) {
        console.error('Error loading room images:', error);
        toast.error('Failed to load room images');
        
        setRoomImages([]);
      } finally {
        setIsRoomImagesLoading(false);
      }
    };
    
    loadRoomImages();
  }, [selectedRoom, id, rooms]);

  const getConditionColor = (condition: string): string => {
    const colors: Record<string, string> = {
      'New': 'bg-green-600',
      'Good': 'bg-blue-600',
      'Fair': 'bg-yellow-600',
      'Poor': 'bg-red-600'
    };
    return colors[condition] || 'bg-gray-600';
  };

  const currentRoom = rooms.find(r => r.id === selectedRoom);

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

  if (!property) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Property not found</h2>
        <p className="mt-4 text-[#CCCCCC]">The property you are looking for does not exist.</p>
        <div className="mt-6">
          <Link href="/properties" className="btn btn-primary">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="header-gold flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/properties" className="gold-accent hover:text-[#E6B52C] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to properties
          </Link>
          <span className="text-[#CCCCCC]">|</span>
          <h1 className="text-xl font-bold text-[#FFFFFF]">{property.name}</h1>
        </div>
        <button 
          onClick={() => alert(`Generating PDF for property ${property.id}`)}
          className="btn btn-primary flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Generate PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card-gold hover-golden">
          <div className="relative h-48 w-full">
            <Image
              src={property.image || '/images/property-placeholder.jpg'}
              alt={property.name}
              fill
              style={{ objectFit: 'cover' }}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
            />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#CCCCCC] text-sm">Reference</p>
                <p className="text-[#FFFFFF] font-medium">{property.reference}</p>
              </div>
              <div>
                <p className="text-[#CCCCCC] text-sm">Creation Date</p>
                <p className="text-[#FFFFFF] font-medium">{new Date(property.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-gold">
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-4">Rooms & Inventory</h2>
            
            <div className="mb-4 flex justify-between items-center">
              <div className="relative w-full max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-[#D4A017]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search for a room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
                />
              </div>
              
              <div className="text-[#CCCCCC] text-sm ml-2">
                {filteredRooms.length} of {rooms.length} rooms
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              <div className="lg:w-1/3 overflow-y-auto pr-1" style={{ maxHeight: '500px' }}>
                <div className="grid grid-cols-2 gap-2">
                  {filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                        selectedRoom === room.id 
                          ? 'bg-[#D4A017]/20 border border-[#D4A017]' 
                          : 'bg-[#1E1E1E] border border-transparent hover:border-[#D4A017]/30 hover:bg-[#1E1E1E]/80'
                      }`}
                    >
                      <div className="w-full aspect-square relative mb-2 rounded-md overflow-hidden">
                        <Image
                          src={room.image || '/images/logo.png'}
                          alt={room.name}
                          fill
                          style={{ 
                            objectFit: !room.image ? 'contain' : 'contain',
                            backgroundColor: !room.image ? '#2D2D2D' : 'transparent'
                          }}
                          className={`transition-all ${selectedRoom === room.id ? 'brightness-110' : 'brightness-75 hover:brightness-100'}`}
                        />
                        {room.hasImages && (
                          <div className="absolute top-1 right-1 bg-[#D4A017] rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#1E1E1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium leading-tight text-center ${selectedRoom === room.id ? 'text-[#D4A017]' : 'text-[#FFFFFF]'}`}>
                        {room.name}
                      </span>
                      <span className="text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full px-2 py-0.5 mt-1">
                        {room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:w-2/3 bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                {selectedRoom ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2D2D2D]">
                      <div className="flex items-center">
                        <h3 className="text-lg font-bold text-[#FFFFFF]">
                          {currentRoom?.name}
                        </h3>
                        <span className="ml-2 px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full">
                          {currentRoom?.itemCount} {currentRoom?.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      
                      {roomImages.length > 1 && (
                        <button 
                          className="text-xs text-[#D4A017] hover:text-[#E6B52C] flex items-center" 
                          onClick={() => setShowFullGallery(true)}
                          disabled={isRoomImagesLoading}
                        >
                          All photos ({roomImages.length})
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="relative h-60 w-full rounded-lg overflow-hidden mb-4">
  {isRoomImagesLoading ? (
    <div className="flex justify-center items-center h-full bg-[#2D2D2D]">
      <div className="text-[#D4A017]">
        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  ) : roomImages.length > 0 ? (
    <>
      <Image
        src={roomImages[currentImageIndex]?.url || '/images/room-placeholder.jpg'}
        alt={currentRoom?.name || ''}
        fill
        style={{ 
          objectFit: 'contain',
          backgroundColor: '#2D2D2D'
        }}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
      />
      
      {roomImages.length > 1 && (
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(prev => (prev === 0 ? roomImages.length - 1 : prev - 1));
            }}
            className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(prev => (prev === roomImages.length - 1 ? 0 : prev + 1));
            }}
            className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      
      {roomImages.length > 1 && (
        <div className="absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white">
          {currentImageIndex + 1} / {roomImages.length}
        </div>
      )}
    </>
  ) : (
    <div className="flex flex-col items-center justify-center h-full bg-[#2D2D2D]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#CCCCCC] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-[#CCCCCC] text-sm">No images available</p>
    </div>
  )}
</div>

<div>
  <div className="flex justify-between items-center mb-2">
    <h4 className="text-sm font-medium text-[#D4A017]">Inventory Items</h4>
    {roomImages.length > 8 && (
      <span className="text-xs text-[#CCCCCC]">Showing {Math.min(8, roomImages.length)} of {roomImages.length} items</span>
    )}
  </div>
  
  {isRoomImagesLoading ? (
    <div className="flex justify-center items-center h-32">
      <div className="text-[#D4A017]">
        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  ) : roomImages.length > 0 ? (
    <div className="space-y-3">
      {/* Limiter l'affichage à 8 éléments maximum pour éviter une liste trop longue */}
      {roomImages.slice(0, 8).map((image, index) => {
        // Générer une description de test unique pour chaque image
        const itemDescriptions = [
          "Main view of the room showing furniture arrangement",
          "Corner view highlighting the decor elements",
          "Detailed view of the built-in furnishings",
          "Window view showing natural lighting conditions",
          "Close-up of special features in the room"
        ];
        const description = itemDescriptions[index % itemDescriptions.length];
        
        return (
          <div 
            key={image.id} 
            className={`bg-[#2D2D2D] rounded-lg p-3 flex hover-golden border ${
              index === currentImageIndex ? 'border-[#D4A017]' : 'border-transparent'
            } cursor-pointer transition-all duration-200`}
            onClick={() => setCurrentImageIndex(index)}
          >
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={image.url}
                alt={`Item ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                className="rounded"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
              />
            </div>
            <div className="ml-3 flex-grow">
              <div className="flex justify-between">
                <h3 className="text-[#FFFFFF] font-medium">Item {index + 1}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full text-white bg-blue-600">
                  Photo
                </span>
              </div>
              <p className="text-sm text-[#CCCCCC] mt-1">Room image of {currentRoom?.name}</p>
              <p className="text-xs text-[#CCCCCC] mt-1">{description}</p>
            </div>
          </div>
        );
      })}
      
      {/* Afficher un bouton pour voir toutes les images dans la galerie si plus de 8 images */}
      {roomImages.length > 8 && (
        <button 
          onClick={() => setShowFullGallery(true)}
          className="w-full py-2 rounded-md bg-[#2D2D2D] text-[#D4A017] text-sm hover:bg-[#3D3D3D] transition-colors"
        >
          View all {roomImages.length} items in gallery
        </button>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-32 bg-[#2D2D2D]/50 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#CCCCCC] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-[#CCCCCC] text-sm">No images available for this room</p>
    </div>
  )}
</div>
                    
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CCCCCC] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2" />
                    </svg>
                    <p className="text-[#CCCCCC]">Select a room to view its inventory</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFullGallery && selectedRoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative bg-[#1E1E1E] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                {currentRoom?.name} - Gallery ({roomImages.length} photos)
              </h3>
              <button 
                onClick={() => setShowFullGallery(false)}
                className="text-[#CCCCCC] hover:text-[#FFFFFF]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="relative h-[60vh]">
              {isRoomImagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-[#D4A017]">
                    <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  </div>
                </div>
              ) : roomImages.length > 0 ? (
                <>
                  <Image
                    src={roomImages[currentImageIndex]?.url || '/images/room-placeholder.jpg'}
                    alt={currentRoom?.name || ''}
                    fill
                    style={{ objectFit: 'contain' }}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
                  />
                  
                  {roomImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => (prev === 0 ? roomImages.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setCurrentImageIndex(prev => (prev === roomImages.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CCCCCC] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[#CCCCCC]">No images available for this room</p>
                </div>
              )}
            </div>
            
            {roomImages.length > 1 && !isRoomImagesLoading && (
              <div className="p-4 border-t border-[#2D2D2D]">
                <div className="flex overflow-x-auto space-x-2 pb-2">
                  {roomImages.map((image, index) => (
                    <button 
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 ${
                        index === currentImageIndex 
                          ? 'border-[#D4A017]' 
                          : 'border-transparent hover:border-[#D4A017]/50'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`Image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-[#CCCCCC]">
                    Image {currentImageIndex + 1} of {roomImages.length}
                  </div>
                  
                  <div className="text-xs text-[#CCCCCC]">
                    {roomImages[currentImageIndex]?.createdAt && (
                      <>Added: {new Date(roomImages[currentImageIndex].createdAt).toLocaleDateString()}</>
                    )}
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