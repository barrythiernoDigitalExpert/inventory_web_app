// src/app/(main)/properties/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPropertyById, fetchPropertyRooms, Property } from '@/lib/services/propertyService';

// Type for a property room
interface Room {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  hasImages?: boolean;
}

// Type for an inventory item
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  image?: string;
  notes?: string;
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomItems, setRoomItems] = useState<InventoryItem[]>([]);
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRoomItemsLoading, setIsRoomItemsLoading] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // Load property details and rooms
  useEffect(() => {
    const loadPropertyDetails = async () => {
      try {
        setIsLoading(true);
        const propertyData = await fetchPropertyById(params.id);
        setProperty(propertyData);
        
        const roomsData = await fetchPropertyRooms(params.id);
        
        // Sort rooms: those with images first, then by name
        const sortedRooms = [...roomsData].sort((a, b) => {
          if (a.hasImages && !b.hasImages) return -1;
          if (!a.hasImages && b.hasImages) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setRooms(sortedRooms);
        setFilteredRooms(sortedRooms);
        
        if (sortedRooms.length > 0) {
          setSelectedRoom(sortedRooms[0].id);
        }
      } catch (error) {
        console.error('Error loading property details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyDetails();
  }, [params.id]);

  // Filter rooms based on search term
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

  // Load items for the selected room
  useEffect(() => {
    const loadRoomItems = async () => {
      if (!selectedRoom) return;
      
      try {
        setIsRoomItemsLoading(true);
        // Simulating an API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulated data
        setRoomItems([
          {
            id: '1',
            name: 'Beige Sofa',
            description: 'Beige 3-seater fabric sofa',
            condition: 'Good',
            image: '/images/items/sofa.jpg',
            notes: 'Slight wear on the right armrest'
          },
          {
            id: '2',
            name: 'Wooden Coffee Table',
            description: 'Rectangular coffee table in solid wood',
            condition: 'Good',
            image: '/images/items/table.jpg'
          },
          {
            id: '3',
            name: 'Floor Lamp',
            description: 'Black floor lamp with white lampshade',
            condition: 'New',
            image: '/images/items/lamp.jpg'
          },
          {
            id: '4',
            name: 'Oriental Rug',
            description: 'Rectangular rug with oriental patterns 200x300cm',
            condition: 'Fair',
            image: '/images/items/carpet.jpg',
            notes: 'Some visible stains'
          }
        ]);
      } catch (error) {
        console.error('Error loading room items:', error);
      } finally {
        setIsRoomItemsLoading(false);
      }
    };

    loadRoomItems();
  }, [selectedRoom]);

  // Load images for the selected room
  useEffect(() => {
    const loadRoomImages = async () => {
      if (!selectedRoom) return;
      
      // Simulate loading images for the selected room
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // The selected room
      const room = rooms.find(r => r.id === selectedRoom);
      
      if (room?.hasImages) {
        // Simulated images for the selected room
        setRoomImages([
          '/images/rooms/room-view-1.jpg',
          '/images/rooms/room-view-2.jpg',
          '/images/rooms/room-view-3.jpg',
          '/images/rooms/room-view-4.jpg',
        ]);
      } else {
        // Just the main image if no multiple images
        setRoomImages([room?.image || '/images/room-placeholder.jpg']);
      }
      
      setCurrentImageIndex(0);
    };
    
    loadRoomImages();
  }, [selectedRoom, rooms]);

  // Loading state
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

  // Property not found
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

  // Function to get color based on condition
  const getConditionColor = (condition: string): string => {
    const colors: Record<string, string> = {
      'New': 'bg-green-600',
      'Good': 'bg-blue-600',
      'Fair': 'bg-yellow-600',
      'Poor': 'bg-red-600'
    };
    return colors[condition] || 'bg-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Navigation bar and actions */}
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

      {/* Property information */}
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
              <div className="col-span-2">
                <p className="text-[#CCCCCC] text-sm">Address</p>
                <p className="text-[#FFFFFF] font-medium">{property.address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[#CCCCCC] text-sm">Description</p>
                <p className="text-[#FFFFFF]">
                  Luxurious villa with private pool, offering panoramic sea views and high-end amenities for optimal comfort.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {/* Improved section for rooms and inventory - side by side view */}
          <div className="card-gold">
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-4">Rooms & Inventory</h2>
            
            {/* Search bar */}
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

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Left column - Room grid */}
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
                          src={room.image || '/images/room-placeholder.jpg'}
                          alt={room.name}
                          fill
                          style={{ objectFit: 'cover' }}
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
                        {room.itemCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right column - Detailed content of the selected room */}
              <div className="lg:w-2/3 bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                {selectedRoom ? (
                  <>
                    {/* Room title and details */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2D2D2D]">
                      <div className="flex items-center">
                        <h3 className="text-lg font-bold text-[#FFFFFF]">
                          {rooms.find(r => r.id === selectedRoom)?.name}
                        </h3>
                        <span className="ml-2 px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full">
                          {rooms.find(r => r.id === selectedRoom)?.itemCount} items
                        </span>
                      </div>
                      {roomImages.length > 1 && (
                        <button className="text-xs text-[#D4A017] hover:text-[#E6B52C] flex items-center" onClick={() => setShowFullGallery(true)}>
                          All photos
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Main room image */}
                    <div className="relative h-40 w-full rounded-lg overflow-hidden mb-4">
                      <Image
                        src={roomImages[currentImageIndex]}
                        alt={rooms.find(r => r.id === selectedRoom)?.name || ''}
                        fill
                        style={{ objectFit: 'cover' }}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
                      />
                      
                      {roomImages.length > 1 && (
                        <div className="absolute bottom-2 right-2 flex space-x-1">
                          <button
                            onClick={() => setCurrentImageIndex(prev => (prev === 0 ? roomImages.length - 1 : prev - 1))}
                            className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex(prev => (prev === roomImages.length - 1 ? 0 : prev + 1))}
                            className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inventory items list */}
                    <div>
                      {isRoomItemsLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="text-[#D4A017]">
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {roomItems.map((item) => (
                            <div key={item.id} className="bg-[#2D2D2D] rounded-lg p-3 flex hover-golden border border-transparent">
                              <div className="relative h-16 w-16 flex-shrink-0">
                                <Image
                                  src={item.image || '/images/item-placeholder.jpg'}
                                  alt={item.name}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  className="rounded"
                                  placeholder="blur"
                                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
                                />
                              </div>
                              <div className="ml-3 flex-grow">
                                <div className="flex justify-between">
                                  <h3 className="text-[#FFFFFF] font-medium">{item.name}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getConditionColor(item.condition)}`}>
                                    {item.condition}
                                  </span>
                                </div>
                                <p className="text-sm text-[#CCCCCC] mt-1">{item.description}</p>
                                {item.notes && (
                                  <p className="text-xs text-[#CCCCCC] mt-1 italic">Note: {item.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
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

      {/* Modal for full image gallery */}
      {showFullGallery && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative bg-[#1E1E1E] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                {rooms.find(r => r.id === selectedRoom)?.name} - Gallery
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
              <Image
                src={roomImages[currentImageIndex]}
                alt={rooms.find(r => r.id === selectedRoom)?.name || ''}
                fill
                style={{ objectFit: 'contain' }}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
              />
              
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
            </div>
            
            <div className="p-4 flex justify-center items-center">
              <div className="flex space-x-1">
                {roomImages.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === currentImageIndex 
                        ? 'bg-[#D4A017]' 
                        : 'bg-[#CCCCCC] hover:bg-[#FFFFFF]'
                    }`}
                  />
                ))}
              </div>
              <div className="ml-4 text-sm text-[#CCCCCC]">
                {currentImageIndex + 1} / {roomImages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}