// // src/app/(main)/properties/[id]/page.tsx
// 'use client';

// import { use, useEffect, useState } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { fetchPropertyById, fetchPropertyRooms, fetchRoomItems, Property } from '@/lib/services/propertyService';
// import { fetchRoomImages, RoomImage, getPlaceholderImages } from '@/lib/services/roomImageService';
// import { toast } from 'react-hot-toast';

// interface Room {
//   id: string;
//   name: string;
//   image: string;
//   itemCount: number;
//   hasImages?: boolean;
// }

// interface InventoryItem {
//   id: string;
//   name: string;
//   description: string;
//   condition: 'New' | 'Good' | 'Fair' | 'Poor';
//   image?: string;
//   notes?: string;
// }

// export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
//   const [property, setProperty] = useState<Property | null>(null);
//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
//   const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
//   const [roomItems, setRoomItems] = useState<InventoryItem[]>([]);
//   const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRoomItemsLoading, setIsRoomItemsLoading] = useState(false);
//   const [isRoomImagesLoading, setIsRoomImagesLoading] = useState(false);
//   const [showFullGallery, setShowFullGallery] = useState(false);
//   const { id } = use(params);

//   useEffect(() => {
//     const loadPropertyDetails = async () => {
//       try {
//         setIsLoading(true);
//         const propertyData = await fetchPropertyById(id);
//         setProperty(propertyData);

//         const roomsData = await fetchPropertyRooms(id);

//         const sortedRooms = [...roomsData].sort((a, b) => {
//           if (a.itemCount !== b.itemCount) {
//             return b.itemCount - a.itemCount;
//           }
//           return a.name.localeCompare(b.name);
//         });

//         setRooms(sortedRooms);
//         setFilteredRooms(sortedRooms);

//         if (sortedRooms.length > 0) {
//           setSelectedRoom(sortedRooms[0].id);
//         }
//       } catch (error) {
//         console.error('Error loading property details:', error);
//         toast.error('Failed to load property details');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadPropertyDetails();
//   }, [id]);

//   useEffect(() => {
//     if (searchTerm.trim() === '') {
//       setFilteredRooms(rooms);
//     } else {
//       const filtered = rooms.filter(room =>
//         room.name.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredRooms(filtered);
//     }
//   }, [searchTerm, rooms]);

//   useEffect(() => {
//     const loadRoomItems = async () => {
//       if (!selectedRoom) return;

//       try {
//         setIsRoomItemsLoading(true);
//         const roomItemsData = await fetchRoomItems(selectedRoom);
//         setRoomItems(roomItemsData);
//       } catch (error) {
//         console.error('Error loading room items:', error);
//         toast.error('Failed to load room items');
//         setRoomItems([]);
//       } finally {
//         setIsRoomItemsLoading(false);
//       }
//     };

//     loadRoomItems();
//   }, [selectedRoom, id]);

//   useEffect(() => {
//     const loadRoomImages = async () => {
//       if (!selectedRoom) return;

//       try {
//         setIsRoomImagesLoading(true);
//         const roomImagesData = await fetchRoomImages(id, selectedRoom);

//         if (roomImagesData && roomImagesData.length > 0) {
//           setRoomImages(roomImagesData);
//         } else {
//           setRoomImages([]);
//         }

//         setCurrentImageIndex(0);
//       } catch (error) {
//         console.error('Error loading room images:', error);
//         toast.error('Failed to load room images');

//         setRoomImages([]);
//       } finally {
//         setIsRoomImagesLoading(false);
//       }
//     };

//     loadRoomImages();
//   }, [selectedRoom, id, rooms]);

//   const getConditionColor = (condition: string): string => {
//     const colors: Record<string, string> = {
//       'New': 'bg-green-600',
//       'Good': 'bg-blue-600',
//       'Fair': 'bg-yellow-600',
//       'Poor': 'bg-red-600'
//     };
//     return colors[condition] || 'bg-gray-600';
//   };

//   const currentRoom = rooms.find(r => r.id === selectedRoom);

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-[#D4A017]">
//           <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//           </svg>
//         </div>
//       </div>
//     );
//   }

//   if (!property) {
//     return (
//       <div className="text-center py-8">
//         <h2 className="text-2xl font-bold">Property not found</h2>
//         <p className="mt-4 text-[#CCCCCC]">The property you are looking for does not exist.</p>
//         <div className="mt-6">
//           <Link href="/properties" className="btn btn-primary">
//             Back to list
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="header-gold flex justify-between items-center">
//         <div className="flex items-center space-x-2">
//           <Link href="/properties" className="gold-accent hover:text-[#E6B52C] flex items-center">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//             </svg>
//             Back to properties
//           </Link>
//           <span className="text-[#CCCCCC]">|</span>
//           <h1 className="text-xl font-bold text-[#FFFFFF]">{property.name}</h1>
//         </div>
//         <button
//           onClick={() => alert(`Generating PDF for property ${property.id}`)}
//           className="btn btn-primary flex items-center"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//           </svg>
//           Generate PDF
//         </button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-1 card-gold hover-golden">
//           <div className="relative h-48 w-full">
//             <Image
//               src={property.image || '/images/property-placeholder.jpg'}
//               alt={property.name}
//               fill
//               style={{ objectFit: 'cover' }}
//               placeholder="blur"
//               blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
//             />
//           </div>
//           <div className="p-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-[#CCCCCC] text-sm">Reference</p>
//                 <p className="text-[#FFFFFF] font-medium">{property.reference}</p>
//               </div>
//               <div>
//                 <p className="text-[#CCCCCC] text-sm">Creation Date</p>
//                 <p className="text-[#FFFFFF] font-medium">{new Date(property.createdAt).toLocaleDateString()}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="lg:col-span-2">
//           <div className="card-gold">
//             <h2 className="text-xl font-bold text-[#FFFFFF] mb-4">Rooms & Inventory</h2>

//             <div className="mb-4 flex justify-between items-center">
//               <div className="relative w-full max-w-xs">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <svg className="h-4 w-4 text-[#D4A017]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search for a room..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]"
//                 />
//               </div>

//               <div className="text-[#CCCCCC] text-sm ml-2">
//                 {filteredRooms.length} of {rooms.length} rooms
//               </div>
//             </div>

//             <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
//               <div className="lg:w-1/3 overflow-y-auto pr-1" style={{ maxHeight: '500px' }}>
//                 <div className="grid grid-cols-2 gap-2">
//                   {filteredRooms.map((room) => (
//                     <button
//                       key={room.id}
//                       onClick={() => setSelectedRoom(room.id)}
//                       className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
//                         selectedRoom === room.id
//                           ? 'bg-[#D4A017]/20 border border-[#D4A017]'
//                           : 'bg-[#1E1E1E] border border-transparent hover:border-[#D4A017]/30 hover:bg-[#1E1E1E]/80'
//                       }`}
//                     >
//                       <div className="w-full aspect-square relative mb-2 rounded-md overflow-hidden">
//                         <Image
//                           src={room.image || '/images/logo.png'}
//                           alt={room.name}
//                           fill
//                           style={{
//                             objectFit: !room.image ? 'contain' : 'contain',
//                             backgroundColor: !room.image ? '#2D2D2D' : 'transparent'
//                           }}
//                           className={`transition-all ${selectedRoom === room.id ? 'brightness-110' : 'brightness-75 hover:brightness-100'}`}
//                         />
//                         {room.hasImages && (
//                           <div className="absolute top-1 right-1 bg-[#D4A017] rounded-full p-1">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#1E1E1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                             </svg>
//                           </div>
//                         )}
//                       </div>
//                       <span className={`text-xs font-medium leading-tight text-center ${selectedRoom === room.id ? 'text-[#D4A017]' : 'text-[#FFFFFF]'}`}>
//                         {room.name}
//                       </span>
//                       <span className="text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full px-2 py-0.5 mt-1">
//                         {room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}
//                       </span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="lg:w-2/3 bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
//                 {selectedRoom ? (
//                   <>
//                     <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2D2D2D]">
//                       <div className="flex items-center">
//                         <h3 className="text-lg font-bold text-[#FFFFFF]">
//                           {currentRoom?.name}
//                         </h3>
//                         <span className="ml-2 px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full">
//                           {currentRoom?.itemCount} {currentRoom?.itemCount === 1 ? 'item' : 'items'}
//                         </span>
//                       </div>

//                       {roomImages.length > 1 && (
//                         <button
//                           className="text-xs text-[#D4A017] hover:text-[#E6B52C] flex items-center"
//                           onClick={() => setShowFullGallery(true)}
//                           disabled={isRoomImagesLoading}
//                         >
//                           All photos ({roomImages.length})
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                           </svg>
//                         </button>
//                       )}
//                     </div>

//                     <div className="relative h-60 w-full rounded-lg overflow-hidden mb-4">
//   {isRoomImagesLoading ? (
//     <div className="flex justify-center items-center h-full bg-[#2D2D2D]">
//       <div className="text-[#D4A017]">
//         <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//         </svg>
//       </div>
//     </div>
//   ) : roomImages.length > 0 ? (
//     <>
//       <Image
//         src={roomImages[currentImageIndex]?.url || '/images/room-placeholder.jpg'}
//         alt={currentRoom?.name || ''}
//         fill
//         style={{
//           objectFit: 'contain',
//           backgroundColor: '#2D2D2D'
//         }}
//         placeholder="blur"
//         blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
//       />

//       {roomImages.length > 1 && (
//         <div className="absolute bottom-2 right-2 flex space-x-1">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setCurrentImageIndex(prev => (prev === 0 ? roomImages.length - 1 : prev - 1));
//             }}
//             className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setCurrentImageIndex(prev => (prev === roomImages.length - 1 ? 0 : prev + 1));
//             }}
//             className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </div>
//       )}

//       {roomImages.length > 1 && (
//         <div className="absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white">
//           {currentImageIndex + 1} / {roomImages.length}
//         </div>
//       )}
//     </>
//   ) : (
//     <div className="flex flex-col items-center justify-center h-full bg-[#2D2D2D]">
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#CCCCCC] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//       </svg>
//       <p className="text-[#CCCCCC] text-sm">No images available</p>
//     </div>
//   )}
// </div>

// <div>
//   <div className="flex justify-between items-center mb-2">
//     <h4 className="text-sm font-medium text-[#D4A017]">Inventory Items</h4>
//     {roomImages.length > 8 && (
//       <span className="text-xs text-[#CCCCCC]">Showing {Math.min(8, roomImages.length)} of {roomImages.length} items</span>
//     )}
//   </div>

//   {isRoomImagesLoading ? (
//     <div className="flex justify-center items-center h-32">
//       <div className="text-[#D4A017]">
//         <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//         </svg>
//       </div>
//     </div>
//   ) : roomImages.length > 0 ? (
//     <div className="space-y-3">
//       {/* Limiter l'affichage à 8 éléments maximum pour éviter une liste trop longue */}
//       {roomImages.slice(0, 8).map((image, index) => {
//         // Générer une description de test unique pour chaque image
//         const itemDescriptions = [
//           "Main view of the room showing furniture arrangement",
//           "Corner view highlighting the decor elements",
//           "Detailed view of the built-in furnishings",
//           "Window view showing natural lighting conditions",
//           "Close-up of special features in the room"
//         ];
//         const description = itemDescriptions[index % itemDescriptions.length];

//         return (
//           <div
//             key={image.id}
//             className={`bg-[#2D2D2D] rounded-lg p-3 flex hover-golden border ${
//               index === currentImageIndex ? 'border-[#D4A017]' : 'border-transparent'
//             } cursor-pointer transition-all duration-200`}
//             onClick={() => setCurrentImageIndex(index)}
//           >
//             <div className="relative h-16 w-16 flex-shrink-0">
//               <Image
//                 src={image.url}
//                 alt={`Item ${index + 1}`}
//                 fill
//                 style={{ objectFit: 'cover' }}
//                 className="rounded"
//                 placeholder="blur"
//                 blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
//               />
//             </div>
//             <div className="ml-3 flex-grow">
//               <div className="flex justify-between">
//                 <h3 className="text-[#FFFFFF] font-medium">Item {index + 1}</h3>
//                 <span className="text-xs px-2 py-0.5 rounded-full text-white bg-blue-600">
//                   Photo
//                 </span>
//               </div>
//               <p className="text-sm text-[#CCCCCC] mt-1">Room image of {currentRoom?.name}</p>
//               <p className="text-xs text-[#CCCCCC] mt-1">{description}</p>
//             </div>
//           </div>
//         );
//       })}

//       {/* Afficher un bouton pour voir toutes les images dans la galerie si plus de 8 images */}
//       {roomImages.length > 8 && (
//         <button
//           onClick={() => setShowFullGallery(true)}
//           className="w-full py-2 rounded-md bg-[#2D2D2D] text-[#D4A017] text-sm hover:bg-[#3D3D3D] transition-colors"
//         >
//           View all {roomImages.length} items in gallery
//         </button>
//       )}
//     </div>
//   ) : (
//     <div className="flex flex-col items-center justify-center h-32 bg-[#2D2D2D]/50 rounded-lg">
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#CCCCCC] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//       </svg>
//       <p className="text-[#CCCCCC] text-sm">No images available for this room</p>
//     </div>
//   )}
// </div>

//                   </>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center h-full text-center py-12">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CCCCCC] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2" />
//                     </svg>
//                     <p className="text-[#CCCCCC]">Select a room to view its inventory</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {showFullGallery && selectedRoom && (
//         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
//           <div className="relative bg-[#1E1E1E] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
//             <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
//               <h3 className="text-lg font-bold text-[#FFFFFF]">
//                 {currentRoom?.name} - Gallery ({roomImages.length} photos)
//               </h3>
//               <button
//                 onClick={() => setShowFullGallery(false)}
//                 className="text-[#CCCCCC] hover:text-[#FFFFFF]"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="relative h-[60vh]">
//               {isRoomImagesLoading ? (
//                 <div className="flex justify-center items-center h-full">
//                   <div className="text-[#D4A017]">
//                     <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                   </div>
//                 </div>
//               ) : roomImages.length > 0 ? (
//                 <>
//                   <Image
//                     src={roomImages[currentImageIndex]?.url || '/images/room-placeholder.jpg'}
//                     alt={currentRoom?.name || ''}
//                     fill
//                     style={{ objectFit: 'contain' }}
//                     placeholder="blur"
//                     blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
//                   />

//                   {roomImages.length > 1 && (
//                     <>
//                       <button
//                         onClick={() => setCurrentImageIndex(prev => (prev === 0 ? roomImages.length - 1 : prev - 1))}
//                         className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                         </svg>
//                       </button>

//                       <button
//                         onClick={() => setCurrentImageIndex(prev => (prev === roomImages.length - 1 ? 0 : prev + 1))}
//                         className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                         </svg>
//                       </button>
//                     </>
//                   )}
//                 </>
//               ) : (
//                 <div className="flex flex-col items-center justify-center h-full">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CCCCCC] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   <p className="text-[#CCCCCC]">No images available for this room</p>
//                 </div>
//               )}
//             </div>

//             {roomImages.length > 1 && !isRoomImagesLoading && (
//               <div className="p-4 border-t border-[#2D2D2D]">
//                 <div className="flex overflow-x-auto space-x-2 pb-2">
//                   {roomImages.map((image, index) => (
//                     <button
//                       key={image.id}
//                       onClick={() => setCurrentImageIndex(index)}
//                       className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 ${
//                         index === currentImageIndex
//                           ? 'border-[#D4A017]'
//                           : 'border-transparent hover:border-[#D4A017]/50'
//                       }`}
//                     >
//                       <Image
//                         src={image.url}
//                         alt={`Image ${index + 1}`}
//                         fill
//                         style={{ objectFit: 'cover' }}
//                       />
//                     </button>
//                   ))}
//                 </div>

//                 <div className="mt-2 flex justify-between items-center">
//                   <div className="text-sm text-[#CCCCCC]">
//                     Image {currentImageIndex + 1} of {roomImages.length}
//                   </div>

//                   <div className="text-xs text-[#CCCCCC]">
//                     {roomImages[currentImageIndex]?.createdAt && (
//                       <>Added: {new Date(roomImages[currentImageIndex].createdAt).toLocaleDateString()}</>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client'

import { use, useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  fetchPropertyById,
  fetchPropertyRooms,
  fetchRoomItems,
  Property
} from '@/lib/services/propertyService'
import {
  fetchRoomImages,
  RoomImage,
  getPlaceholderImages,
  deleteRoomImage,
  uploadRoomImages,
  updateRoomImage
} from '@/lib/services/roomImageService'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation';

interface Room {
  id: string
  name: string
  image: string
  itemCount: number
  hasImages?: boolean
}

interface InventoryItem {
  id: string
  name: string
  description: string
  condition: 'New' | 'Good' | 'Fair' | 'Poor'
  image?: string
  notes?: string
}

export default function PropertyDetailPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [roomItems, setRoomItems] = useState<InventoryItem[]>([])
  const [roomImages, setRoomImages] = useState<RoomImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRoomItemsLoading, setIsRoomItemsLoading] = useState(false)
  const [isRoomImagesLoading, setIsRoomImagesLoading] = useState(false)
  const [showFullGallery, setShowFullGallery] = useState(false)

  const [imageToDelete, setImageToDelete] = useState<RoomImage | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageToReplace, setImageToReplace] = useState<RoomImage | null>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImageToEdit, setSelectedImageToEdit] =
    useState<RoomImage | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [imageRotation, setImageRotation] = useState(0)
  const [cropMode, setCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({
    x: 20,
    y: 20,
    width: 200,
    height: 200
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [showAdjustControls, setShowAdjustControls] = useState(false)
  const imageEditorRef = useRef<HTMLDivElement>(null)

  const { id } = use(params)
  const router = useRouter();

  useEffect(() => {
    const loadPropertyDetails = async () => {
      try {
        setIsLoading(true)
        const propertyData = await fetchPropertyById(id)
        setProperty(propertyData)

        const roomsData = await fetchPropertyRooms(id)

        const sortedRooms = [...roomsData].sort((a, b) => {
          if (a.itemCount !== b.itemCount) {
            return b.itemCount - a.itemCount
          }
          return a.name.localeCompare(b.name)
        })

        setRooms(sortedRooms)
        setFilteredRooms(sortedRooms)

        if (sortedRooms.length > 0) {
          setSelectedRoom(sortedRooms[0].id)
        }
      } catch (error) {
        console.error('Error loading property details:', error)
        toast.error('Failed to load property details')
      } finally {
        setIsLoading(false)
      }
    }

    loadPropertyDetails()
  }, [id])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRooms(rooms)
    } else {
      const filtered = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRooms(filtered)
    }
  }, [searchTerm, rooms])

  useEffect(() => {
    const loadRoomItems = async () => {
      if (!selectedRoom) return

      try {
        setIsRoomItemsLoading(true)
        const roomItemsData = await fetchRoomItems(selectedRoom)
        setRoomItems(roomItemsData)
      } catch (error) {
        console.error('Error loading room items:', error)
        toast.error('Failed to load room items')
        setRoomItems([])
      } finally {
        setIsRoomItemsLoading(false)
      }
    }

    loadRoomItems()
  }, [selectedRoom, id])

  useEffect(() => {
    const loadRoomImages = async () => {
      if (!selectedRoom) return

      try {
        setIsRoomImagesLoading(true)
        const roomImagesData = await fetchRoomImages(id, selectedRoom)

        if (roomImagesData && roomImagesData.length > 0) {
          setRoomImages(roomImagesData)
        } else {
          setRoomImages([])
        }

        setCurrentImageIndex(0)
      } catch (error) {
        console.error('Error loading room images:', error)
        toast.error('Failed to load room images')

        setRoomImages([])
      } finally {
        setIsRoomImagesLoading(false)
      }
    }

    loadRoomImages()
  }, [selectedRoom, id, rooms])

  // Fonction pour gérer la suppression d'image
  const handleDeleteImage = async () => {
    if (!imageToDelete || !selectedRoom) return

    try {
      const success = await deleteRoomImage(id, selectedRoom, imageToDelete.id)
      if (success) {
        // Mettre à jour la liste d'images localement
        setRoomImages(prevImages =>
          prevImages.filter(img => img.id !== imageToDelete.id)
        )
        setShowDeleteConfirm(false)
        setImageToDelete(null)

        // Ajuster l'index courant si nécessaire
        if (currentImageIndex >= roomImages.length - 1) {
          setCurrentImageIndex(Math.max(0, roomImages.length - 2))
        }

        toast.success('Image deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }

  // Fonction pour gérer l'upload d'images
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedRoom) return

    try {
      // Afficher un toast de chargement
      toast.loading('Uploading images...')

      const uploadedImages = await uploadRoomImages(
        id,
        selectedRoom,
        Array.from(files)
      )

      if (uploadedImages) {
        // Mettre à jour la liste d'images localement
        setRoomImages(prevImages => [...prevImages, ...uploadedImages])
        // Réinitialiser le champ de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        toast.dismiss()
        toast.success(`${files.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.dismiss()
      toast.error('Failed to upload images')
    }
  }

  const handleReplaceImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0 || !imageToReplace || !selectedRoom) return

    try {
      const toastId = toast.loading('Replacing image...')

      // Lire le premier fichier comme base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            // Appeler le service pour remplacer l'image
            const success = await updateRoomImage(
              id,
              selectedRoom,
              imageToReplace.id,
              reader.result
            )

            if (success) {
              // Forcer le rechargement des images depuis le serveur avec un timestamp pour éviter le cache
              setIsRoomImagesLoading(true)
              try {
                const updatedImages = await fetchRoomImages(id, selectedRoom)

                // Forcer le rafraîchissement des URL d'images avec un timestamp
                const refreshedImages = updatedImages.map(img => ({
                  ...img,
                  url: img.url.includes('?')
                    ? `${img.url.split('?')[0]}?t=${Date.now()}`
                    : `${img.url}?t=${Date.now()}`
                }))

                setRoomImages(refreshedImages)

                // Sélectionner l'image mise à jour
                const updatedImageIndex = refreshedImages.findIndex(
                  img => img.id === imageToReplace.id
                )
                if (updatedImageIndex !== -1) {
                  setCurrentImageIndex(updatedImageIndex)
                }

                toast.dismiss(toastId)
                toast.success('Image replaced successfully')
              } catch (fetchErr) {
                console.error('Error fetching updated images:', fetchErr)
                toast.dismiss(toastId)
                toast.error('Image replaced but failed to refresh view')

                // Forcer un rechargement complet de la page comme solution de secours
                window.location.reload()
              } finally {
                setIsRoomImagesLoading(false)
              }
            } else {
              toast.dismiss(toastId)
              toast.error('Failed to replace image')
            }
          } catch (err) {
            console.error('Error in image replacement:', err)
            toast.dismiss(toastId)
            toast.error('Error processing the image replacement')
          }
        }
      }

      reader.readAsDataURL(files[0])

      // Réinitialiser le champ de fichier
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = ''
      }
      setImageToReplace(null)
    } catch (error) {
      console.error('Error replacing image:', error)
      toast.dismiss()
      toast.error('Failed to replace image')
    }
  }

  const getConditionColor = (condition: string): string => {
    const colors: Record<string, string> = {
      New: 'bg-green-600',
      Good: 'bg-blue-600',
      Fair: 'bg-yellow-600',
      Poor: 'bg-red-600'
    }
    return colors[condition] || 'bg-gray-600'
  }

  const openImageEditor = (image: RoomImage) => {
    setSelectedImageToEdit(image)
    setShowImageEditor(true)
    setImageRotation(0)
    setCropMode(false)
    setShowAdjustControls(false)
    setBrightness(100)
    setContrast(100)
  }

  const closeImageEditor = () => {
    setSelectedImageToEdit(null)
    setShowImageEditor(false)
    setImageRotation(0)
    setCropMode(false)
    setShowAdjustControls(false)
    setBrightness(100)
    setContrast(100)
    setIsDragging(false)
    setCropRect({ x: 20, y: 20, width: 200, height: 200 })
  }

  const rotateImage = (direction: 'left' | 'right') => {
    const newRotation =
      direction === 'right'
        ? (imageRotation + 90) % 360
        : (imageRotation - 90 + 360) % 360
    setImageRotation(newRotation)
  }

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current) return

    e.preventDefault()
    setIsDragging(true)

    const rect = imageEditorRef.current.getBoundingClientRect()
    setDragStartPos({
      x: e.clientX - rect.left - cropRect.x,
      y: e.clientY - rect.top - cropRect.y
    })
  }

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current || !isDragging) return

    e.preventDefault()
    const rect = imageEditorRef.current.getBoundingClientRect()
    const maxX = rect.width - cropRect.width
    const maxY = rect.height - cropRect.height

    let newX = e.clientX - rect.left - dragStartPos.x
    let newY = e.clientY - rect.top - dragStartPos.y

    // Limit to container
    newX = Math.max(0, Math.min(newX, maxX))
    newY = Math.max(0, Math.min(newY, maxY))

    setCropRect({
      ...cropRect,
      x: newX,
      y: newY
    })
  }

  const handleCropMouseUp = () => {
    setIsDragging(false)
  }

  const handleResizeCrop = (direction: string, e: React.MouseEvent) => {
    if (!cropMode || !imageEditorRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const rect = imageEditorRef.current.getBoundingClientRect()

    // Resize function to apply during mouse movement
    const resize = (e: MouseEvent) => {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let newRect = { ...cropRect }

      switch (direction) {
        case 'topLeft':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.width - 50),
            y: Math.min(y, cropRect.y + cropRect.height - 50),
            width:
              cropRect.x +
              cropRect.width -
              Math.min(x, cropRect.x + cropRect.width - 50),
            height:
              cropRect.y +
              cropRect.height -
              Math.min(y, cropRect.y + cropRect.height - 50)
          }
          break
        case 'topRight':
          newRect = {
            x: cropRect.x,
            y: Math.min(y, cropRect.y + cropRect.height - 50),
            width: Math.max(50, x - cropRect.x),
            height:
              cropRect.y +
              cropRect.height -
              Math.min(y, cropRect.y + cropRect.height - 50)
          }
          break
        case 'bottomLeft':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.width - 50),
            y: cropRect.y,
            width:
              cropRect.x +
              cropRect.width -
              Math.min(x, cropRect.x + cropRect.width - 50),
            height: Math.max(50, y - cropRect.y)
          }
          break
        case 'bottomRight':
          newRect = {
            x: cropRect.x,
            y: cropRect.y,
            width: Math.max(50, x - cropRect.x),
            height: Math.max(50, y - cropRect.y)
          }
          break
      }

      // Keep rectangle within bounds
      if (newRect.x < 0) {
        newRect.width += newRect.x
        newRect.x = 0
      }
      if (newRect.y < 0) {
        newRect.height += newRect.y
        newRect.y = 0
      }
      if (newRect.x + newRect.width > rect.width) {
        newRect.width = rect.width - newRect.x
      }
      if (newRect.y + newRect.height > rect.height) {
        newRect.height = rect.height - newRect.y
      }

      setCropRect(newRect)
    }

    const cleanUp = () => {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', cleanUp)
    }

    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', cleanUp)
  }

  const applyCrop = async () => {
    if (!selectedImageToEdit || !cropMode) {
      setCropMode(false)
      return
    }

    // Ensure this code runs on the client side
    if (typeof window === 'undefined') return

    try {
      toast.loading('Processing image...')

      // Create canvas for cropping
      const canvas = document.createElement('canvas')
      const imgElement = new window.Image()

      imgElement.onload = async () => {
        // Get editor container dimensions
        const editorElement = imageEditorRef.current
        if (!editorElement) return

        const editorRect = editorElement.getBoundingClientRect()

        // Calculate ratios between actual image and display
        const displayWidth = editorRect.width
        const displayHeight = editorRect.height

        // Calculate ratio to fit image to container
        const imgRatio = imgElement.width / imgElement.height
        const containerRatio = displayWidth / displayHeight

        // Determine actual dimensions and position of image in element
        let imgWidth, imgHeight, offsetX, offsetY

        if (imgRatio > containerRatio) {
          // Image is wider than container
          imgWidth = displayWidth
          imgHeight = displayWidth / imgRatio
          offsetX = 0
          offsetY = (displayHeight - imgHeight) / 2
        } else {
          // Image is taller than container
          imgHeight = displayHeight
          imgWidth = displayHeight * imgRatio
          offsetX = (displayWidth - imgWidth) / 2
          offsetY = 0
        }

        // Calculate actual crop coordinates
        const scaleX = imgElement.width / imgWidth
        const scaleY = imgElement.height / imgHeight

        const cropX = (cropRect.x - offsetX) * scaleX
        const cropY = (cropRect.y - offsetY) * scaleY
        const cropWidth = cropRect.width * scaleX
        const cropHeight = cropRect.height * scaleY

        // Configure canvas for cropping
        canvas.width = cropWidth
        canvas.height = cropHeight

        // Apply rotation if needed
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Handle rotation if necessary
        if (imageRotation !== 0) {
          // Adjust canvas dimensions to account for rotation
          if (imageRotation === 90 || imageRotation === 270) {
            canvas.width = cropHeight
            canvas.height = cropWidth
          }

          // Move context to center of canvas
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((imageRotation * Math.PI) / 180)

          // Draw cropped and rotated image
          const drawX =
            imageRotation === 90
              ? -cropHeight / 2
              : imageRotation === 270
              ? -cropHeight / 2
              : -cropWidth / 2
          const drawY =
            imageRotation === 90
              ? -cropWidth / 2
              : imageRotation === 270
              ? -cropWidth / 2
              : -cropHeight / 2
          const drawWidth =
            imageRotation === 90 || imageRotation === 270
              ? cropHeight
              : cropWidth
          const drawHeight =
            imageRotation === 90 || imageRotation === 270
              ? cropWidth
              : cropHeight

          ctx.drawImage(
            imgElement,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight
          )

          ctx.restore()
        } else {
          // Without rotation, simply draw the cropped part
          ctx.drawImage(
            imgElement,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          )
        }

        // Convert canvas to dataURL
        const croppedDataURL = canvas.toDataURL('image/jpeg', 0.9)

        // Now call the API to update the image
        if (selectedImageToEdit && selectedRoom) {
          const success = await updateRoomImage(
            id,
            selectedRoom,
            selectedImageToEdit.id,
            croppedDataURL
          )

          if (success) {
            // Force refresh of images
            setIsRoomImagesLoading(true)
            try {
              const updatedImages = await fetchRoomImages(id, selectedRoom)
              const refreshedImages = updatedImages.map(img => ({
                ...img,
                url: img.url.includes('?')
                  ? `${img.url.split('?')[0]}?t=${Date.now()}`
                  : `${img.url}?t=${Date.now()}`
              }))

              setRoomImages(refreshedImages)
              toast.dismiss()
              toast.success('Image updated successfully')
            } catch (error) {
              console.error('Error refreshing images:', error)
              toast.dismiss()
              toast.error('Image updated but failed to refresh view')
            } finally {
              setIsRoomImagesLoading(false)
            }
          } else {
            toast.dismiss()
            toast.error('Failed to update image')
          }
        }

        // Reset rotation state
        setImageRotation(0)
        setCropMode(false)
        setShowImageEditor(false)
      }

      // Load source image
      imgElement.src = selectedImageToEdit.url
    } catch (error) {
      console.error('Error during cropping:', error)
      toast.dismiss()
      toast.error('Error processing image')
      setCropMode(false)
    }
  }

  const applyAdjustments = async () => {
    if (!selectedImageToEdit) return

    // Ensure this code runs on the client side
    if (typeof window === 'undefined') return

    try {
      toast.loading('Processing image...')

      // Create canvas to apply filters
      const canvas = document.createElement('canvas')
      const imgElement = new window.Image()

      imgElement.onload = async () => {
        canvas.width = imgElement.width
        canvas.height = imgElement.height

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // First draw the original image
        ctx.drawImage(imgElement, 0, 0)

        // Apply filters by manipulating pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Apply brightness/contrast
        const brightnessRatio = brightness / 100
        const contrastFactor = (contrast / 100) * 2 - 1 // -1 to 1

        for (let i = 0; i < data.length; i += 4) {
          // Brightness
          data[i] = data[i] * brightnessRatio // R
          data[i + 1] = data[i + 1] * brightnessRatio // G
          data[i + 2] = data[i + 2] * brightnessRatio // B

          // Contrast
          if (contrastFactor !== 0) {
            data[i] = Math.min(
              255,
              Math.max(0, (data[i] - 128) * (contrastFactor + 1) + 128)
            )
            data[i + 1] = Math.min(
              255,
              Math.max(0, (data[i + 1] - 128) * (contrastFactor + 1) + 128)
            )
            data[i + 2] = Math.min(
              255,
              Math.max(0, (data[i + 2] - 128) * (contrastFactor + 1) + 128)
            )
          }
        }

        // Update image with applied filters
        ctx.putImageData(imageData, 0, 0)

        // Convert canvas to dataURL
        const adjustedDataURL = canvas.toDataURL('image/jpeg', 0.9)

        // Now call the API to update the image
        if (selectedImageToEdit && selectedRoom) {
          const success = await updateRoomImage(
            id,
            selectedRoom,
            selectedImageToEdit.id,
            adjustedDataURL
          )

          if (success) {
            // Force refresh of images
            setIsRoomImagesLoading(true)
            try {
              const updatedImages = await fetchRoomImages(id, selectedRoom)
              const refreshedImages = updatedImages.map(img => ({
                ...img,
                url: img.url.includes('?')
                  ? `${img.url.split('?')[0]}?t=${Date.now()}`
                  : `${img.url}?t=${Date.now()}`
              }))

              setRoomImages(refreshedImages)
              toast.dismiss()
              toast.success('Image updated successfully')
            } catch (error) {
              console.error('Error refreshing images:', error)
              toast.dismiss()
              toast.error('Image updated but failed to refresh view')
            } finally {
              setIsRoomImagesLoading(false)
            }
          } else {
            toast.dismiss()
            toast.error('Failed to update image')
          }
        }

        // Hide adjustment controls
        setShowAdjustControls(false)
        // Reset values for next use
        setBrightness(100)
        setContrast(100)
        setShowImageEditor(false)
      }

      // Load source image
      imgElement.src = selectedImageToEdit.url
    } catch (error) {
      console.error('Error during adjustment:', error)
      toast.dismiss()
      toast.error('Error processing image')
      setShowAdjustControls(false)
    }
  }

  const currentRoom = rooms.find(r => r.id === selectedRoom)

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-[#D4A017]'>
          <svg
            className='animate-spin h-8 w-8'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-2xl font-bold'>Property not found</h2>
        <p className='mt-4 text-[#CCCCCC]'>
          The property you are looking for does not exist.
        </p>
        <div className='mt-6'>
          <Link href='/properties' className='btn btn-primary'>
            Back to list
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='header-gold flex justify-between items-center'>
        <div className='flex items-center space-x-2'>
          <Link
            href='/properties'
            className='gold-accent hover:text-[#E6B52C] flex items-center'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5 mr-1'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
            Back to properties
          </Link>
          <span className='text-[#CCCCCC]'>|</span>
          <h1 className='text-xl font-bold text-[#FFFFFF]'>{property.name}</h1>
        </div>
        <button
  onClick={() => router.push(`/properties/${id}/pdf-editor`)}
  className="btn btn-primary flex items-center"
>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5 mr-1'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
            />
          </svg>
          Generate PDF
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-1 card-gold hover-golden'>
          <div className='relative h-48 w-full'>
            <Image
              src={property.image || '/images/property-placeholder.jpg'}
              alt={property.name}
              fill
              style={{ objectFit: 'cover' }}
              placeholder='blur'
              blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=='
            />
          </div>
          <div className='p-4'>
          <div className="space-y-3">
    <div>
      <p className="text-[#CCCCCC] text-sm">Reference Number</p>
      <p className="text-[#FFFFFF] font-medium">{property.reference}</p>
    </div>
    <div>
      <p className="text-[#CCCCCC] text-sm">Property Address</p>
      <p className="text-[#FFFFFF] font-medium">{property.address || "Not specified"}</p>
    </div>
    <div>
      <p className="text-[#CCCCCC] text-sm">Date of Inventory</p>
      <p className="text-[#FFFFFF] font-medium">{new Date(property.createdAt).toLocaleDateString()}</p>
    </div>
    <div>
      <p className="text-[#CCCCCC] text-sm">Name Listing Person</p>
      <p className="text-[#FFFFFF] font-medium">
        {/* {property.listingPerson || "Not specified"} */}
        {"Not specified"}
        
      </p>
    </div>
    <div>
      <p className="text-[#CCCCCC] text-sm">Owner Inventory List</p>
      <div className="text-[#FFFFFF] font-medium">
        {/* {property.owners && property.owners.length > 0 ? 
          property.owners.map((owner, index) => (
            <div key={index} className="flex items-center">
              <span className="w-2 h-2 bg-[#D4A017] rounded-full mr-2"></span>
              <span>{owner}</span>
            </div>
          )) : 
          "Not specified"
        } */}

        {
          "Not specified"
        }
      </div>
    </div>
  </div>
          </div>
        </div>

        <div className='lg:col-span-2'>
          <div className='card-gold'>
            <h2 className='text-xl font-bold text-[#FFFFFF] mb-4'>
              Rooms & Inventory
            </h2>

            <div className='mb-4 flex justify-between items-center'>
              <div className='relative w-full max-w-xs'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg
                    className='h-4 w-4 text-[#D4A017]'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
                <input
                  type='text'
                  placeholder='Search for a room...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 pr-4 py-2 w-full text-sm rounded-md bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]'
                />
              </div>

              <div className='text-[#CCCCCC] text-sm ml-2'>
                {filteredRooms.length} of {rooms.length} rooms
              </div>
            </div>

            <div className='flex flex-col lg:flex-row gap-4 lg:gap-6'>
              <div
                className='lg:w-1/3 overflow-y-auto pr-1'
                style={{ maxHeight: '500px' }}
              >
                <div className='grid grid-cols-2 gap-2'>
                  {filteredRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                        selectedRoom === room.id
                          ? 'bg-[#D4A017]/20 border border-[#D4A017]'
                          : 'bg-[#1E1E1E] border border-transparent hover:border-[#D4A017]/30 hover:bg-[#1E1E1E]/80'
                      }`}
                    >
                      <div className='w-full aspect-square relative mb-2 rounded-md overflow-hidden'>
                        <Image
                          src={room.image || '/images/logo.png'}
                          alt={room.name}
                          fill
                          style={{
                            objectFit: !room.image ? 'contain' : 'contain',
                            backgroundColor: !room.image
                              ? '#2D2D2D'
                              : 'transparent'
                          }}
                          className={`transition-all ${
                            selectedRoom === room.id
                              ? 'brightness-110'
                              : 'brightness-75 hover:brightness-100'
                          }`}
                        />
                        {room.hasImages && (
                          <div className='absolute top-1 right-1 bg-[#D4A017] rounded-full p-1'>
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-3 w-3 text-[#1E1E1E]'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium leading-tight text-center ${
                          selectedRoom === room.id
                            ? 'text-[#D4A017]'
                            : 'text-[#FFFFFF]'
                        }`}
                      >
                        {room.name}
                      </span>
                      <span className='text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full px-2 py-0.5 mt-1'>
                        {room.itemCount}{' '}
                        {room.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className='lg:w-2/3 bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto'
                style={{ maxHeight: '500px' }}
              >
                {selectedRoom ? (
                  <>
                    <div className='flex items-center justify-between mb-4 pb-2 border-b border-[#2D2D2D]'>
                      <div className='flex items-center'>
                        <h3 className='text-lg font-bold text-[#FFFFFF]'>
                          {currentRoom?.name}
                        </h3>
                        <span className='ml-2 px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full'>
                          {currentRoom?.itemCount}{' '}
                          {currentRoom?.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className='flex items-center space-x-2'>
                        {/* Bouton pour ajouter des images */}
                        <button
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.click()
                            }
                          }}
                          className='p-1 rounded-full bg-[#D4A017] hover:bg-[#E6B52C] text-black flex items-center justify-center'
                          title='Add new images'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-5 w-5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 4v16m8-8H4'
                            />
                          </svg>
                        </button>

                        {roomImages.length > 1 && (
                          <button
                            className='text-xs text-[#D4A017] hover:text-[#E6B52C] flex items-center'
                            onClick={() => setShowFullGallery(true)}
                            disabled={isRoomImagesLoading}
                          >
                            All photos ({roomImages.length})
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-4 w-4 ml-1'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M14 5l7 7m0 0l-7 7m7-7H3'
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className='relative h-60 w-full rounded-lg overflow-hidden mb-4'>
                      {isRoomImagesLoading ? (
                        <div className='flex justify-center items-center h-full bg-[#2D2D2D]'>
                          <div className='text-[#D4A017]'>
                            <svg
                              className='animate-spin h-6 w-6'
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                          </div>
                        </div>
                      ) : roomImages.length > 0 ? (
                        <div className='relative h-full w-full'>
                          <Image
                            src={
                              roomImages[currentImageIndex]?.url ||
                              '/images/room-placeholder.jpg'
                            }
                            alt={currentRoom?.name || ''}
                            fill
                            style={{
                              objectFit: 'contain',
                              backgroundColor: '#2D2D2D'
                            }}
                            placeholder='blur'
                            blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=='
                          />

                          <div className='absolute top-2 right-2 flex space-x-2'>
                            <button
                              onClick={() =>
                                openImageEditor(roomImages[currentImageIndex])
                              }
                              className='p-2 rounded-lg bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white'
                              title='Edit this image'
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setImageToReplace(roomImages[currentImageIndex])
                                if (replaceFileInputRef.current) {
                                  replaceFileInputRef.current.click()
                                }
                              }}
                              className='p-2 rounded-lg bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white'
                              title='Replace this image'
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                                />
                              </svg>
                            </button>
                            {/* Bouton pour supprimer l'image */}
                            <button
                              onClick={() => {
                                setImageToDelete(roomImages[currentImageIndex])
                                setShowDeleteConfirm(true)
                              }}
                              className='p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white'
                              title='Delete this image'
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-5 w-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                              </svg>
                            </button>
                          </div>

                          {roomImages.length > 1 && (
                            <div className='absolute bottom-2 right-2 flex space-x-1'>
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setCurrentImageIndex(prev =>
                                    prev === 0
                                      ? roomImages.length - 1
                                      : prev - 1
                                  )
                                }}
                                className='p-1 rounded-full bg-black/50 hover:bg-black/70 text-white'
                              >
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-4 w-4'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 19l-7-7 7-7'
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setCurrentImageIndex(prev =>
                                    prev === roomImages.length - 1
                                      ? 0
                                      : prev + 1
                                  )
                                }}
                                className='p-1 rounded-full bg-black/50 hover:bg-black/70 text-white'
                              >
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-4 w-4'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5l7 7-7 7'
                                  />
                                </svg>
                              </button>
                            </div>
                          )}

                          <div className='absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white'>
                            {currentImageIndex + 1} / {roomImages.length}
                          </div>
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center h-full bg-[#2D2D2D]'>
                          <button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.click()
                              }
                            }}
                            className='p-6 rounded-full bg-[#2D2D2D] border-2 border-dashed border-[#D4A017] hover:bg-[#3D3D3D] transition-colors mb-4'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-12 w-12 text-[#D4A017]'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1.5}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                          </button>
                          <p className='text-[#CCCCCC] text-sm'>
                            Add images to this room
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <h4 className='text-sm font-medium text-[#D4A017]'>
                          Inventory Items
                        </h4>
                        {roomImages.length > 8 && (
                          <span className='text-xs text-[#CCCCCC]'>
                            Showing {Math.min(8, roomImages.length)} of{' '}
                            {roomImages.length} items
                          </span>
                        )}
                      </div>

                      {isRoomImagesLoading ? (
                        <div className='flex justify-center items-center h-32'>
                          <div className='text-[#D4A017]'>
                            <svg
                              className='animate-spin h-6 w-6'
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                          </div>
                        </div>
                      ) : roomImages.length > 0 ? (
                        <div className='space-y-3'>
                          {roomImages.slice(0, 8).map((image, index) => {
                            const itemDescriptions = [
                              'Main view of the room showing furniture arrangement',
                              'Corner view highlighting the decor elements',
                              'Detailed view of the built-in furnishings',
                              'Window view showing natural lighting conditions',
                              'Close-up of special features in the room'
                            ]
                            const description =
                              itemDescriptions[index % itemDescriptions.length]

                            return (
                              <div
                                key={image.id}
                                className={`bg-[#2D2D2D] rounded-lg p-3 flex hover-golden border ${
                                  index === currentImageIndex
                                    ? 'border-[#D4A017]'
                                    : 'border-transparent'
                                } cursor-pointer transition-all duration-200`}
                                onClick={() => setCurrentImageIndex(index)}
                              >
                                <div className='relative h-16 w-16 flex-shrink-0'>
                                  <Image
                                    src={image.url}
                                    alt={`Item ${index + 1}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className='rounded'
                                    placeholder='blur'
                                    blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=='
                                  />

                                  {/* Actions sur les miniatures */}
                                  <div className='absolute -top-2 -right-2 flex space-x-1'>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        openImageEditor(image)
                                      }}
                                      className='p-1 rounded-full bg-[#D4A017] text-white hover:bg-[#E6B52C]'
                                      title='Edit image'
                                    >
                                      <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='h-3 w-3'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        setImageToDelete(image)
                                        setShowDeleteConfirm(true)
                                      }}
                                      className='p-1 rounded-full bg-red-600 text-white hover:bg-red-700'
                                      title='Delete image'
                                    >
                                      <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='h-3 w-3'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M6 18L18 6M6 6l12 12'
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div className='ml-3 flex-grow'>
                                  <div className='flex justify-between'>
                                    <h3 className='text-[#FFFFFF] font-medium'>
                                      Item {index + 1}
                                    </h3>

                                    <span className='text-xs px-2 py-0.5 rounded-full text-white bg-blue-600'>
                                      Photo
                                    </span>
                                  </div>
                                  <p className='text-sm text-[#CCCCCC] mt-1'>
                                    Room image of {currentRoom?.name}
                                  </p>
                                  <p className='text-xs text-[#CCCCCC] mt-1'>
                                    {description}
                                  </p>
                                </div>
                              </div>
                            )
                          })}

                          {roomImages.length > 8 && (
                            <button
                              onClick={() => setShowFullGallery(true)}
                              className='w-full py-2 rounded-md bg-[#2D2D2D] text-[#D4A017] text-sm hover:bg-[#3D3D3D] transition-colors'
                            >
                              View all {roomImages.length} items in gallery
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.click()
                              }
                            }}
                            className='w-full py-2 mt-2 rounded-md bg-[#2D2D2D] text-[#D4A017] text-sm hover:bg-[#3D3D3D] transition-colors border border-dashed border-[#D4A017] flex items-center justify-center'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-4 w-4 mr-2'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                            Add More Images
                          </button>
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center h-32 bg-[#2D2D2D]/50 rounded-lg'>
                          <button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.click()
                              }
                            }}
                            className='py-3 px-4 rounded-md bg-[#2D2D2D] text-[#D4A017] hover:bg-[#3D3D3D] transition-colors border border-dashed border-[#D4A017] flex items-center'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5 mr-2'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                            Add Images to This Room
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='flex flex-col items-center justify-center h-full text-center py-12'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-12 w-12 text-[#CCCCCC] mb-4'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2'
                      />
                    </svg>
                    <p className='text-[#CCCCCC]'>
                      Select a room to view its inventory
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFullGallery && selectedRoom && (
        <div className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4'>
          <div className='relative bg-[#1E1E1E] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden'>
            <div className='p-4 border-b border-[#2D2D2D] flex justify-between items-center'>
              <h3 className='text-lg font-bold text-[#FFFFFF]'>
                {currentRoom?.name} - Gallery ({roomImages.length} photos)
              </h3>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                    }
                  }}
                  className='flex items-center text-[#D4A017] hover:text-[#E6B52C]'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-1'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  Add Images
                </button>
                <button
                  onClick={() => setShowFullGallery(false)}
                  className='text-[#CCCCCC] hover:text-[#FFFFFF]'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className='relative h-[60vh]'>
              {isRoomImagesLoading ? (
                <div className='flex justify-center items-center h-full'>
                  <div className='text-[#D4A017]'>
                    <svg
                      className='animate-spin h-8 w-8'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                  </div>
                </div>
              ) : roomImages.length > 0 ? (
                <>
                  <Image
                    src={
                      roomImages[currentImageIndex]?.url ||
                      '/images/room-placeholder.jpg'
                    }
                    alt={currentRoom?.name || ''}
                    fill
                    style={{ objectFit: 'contain' }}
                    placeholder='blur'
                    blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=='
                  />

                  <div className='absolute top-4 right-4'>
                    <button
                      onClick={() => {
                        setShowFullGallery(false)
                        openImageEditor(roomImages[currentImageIndex])
                      }}
                      className='p-2 rounded-md bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white'
                      title='Edit this image'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                        />
                      </svg>
                    </button>
                    {/* Bouton pour remplacer l'image */}
                    <button
                      onClick={() => {
                        setImageToReplace(roomImages[currentImageIndex])
                        if (replaceFileInputRef.current) {
                          replaceFileInputRef.current.click()
                        }
                      }}
                      className='p-2 rounded-md bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white'
                      title='Replace this image'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setImageToDelete(roomImages[currentImageIndex])
                        setShowDeleteConfirm(true)
                      }}
                      className='p-2 rounded-md bg-red-600 hover:bg-red-700 text-white'
                      title='Delete this image'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    </button>
                  </div>

                  {roomImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex(prev =>
                            prev === 0 ? roomImages.length - 1 : prev - 1
                          )
                        }
                        className='absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-6 w-6'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 19l-7-7 7-7'
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() =>
                          setCurrentImageIndex(prev =>
                            prev === roomImages.length - 1 ? 0 : prev + 1
                          )
                        }
                        className='absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-6 w-6'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 5l7 7-7 7'
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className='flex flex-col items-center justify-center h-full'>
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click()
                      }
                    }}
                    className='p-6 rounded-full bg-[#2D2D2D] border-2 border-dashed border-[#D4A017] hover:bg-[#3D3D3D] transition-colors mb-4'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-12 w-12 text-[#D4A017]'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                  </button>
                  <p className='text-[#CCCCCC]'>Add images to this room</p>
                </div>
              )}
            </div>

            {roomImages.length > 0 && !isRoomImagesLoading && (
              <div className='p-4 border-t border-[#2D2D2D]'>
                <div className='flex overflow-x-auto space-x-2 pb-2'>
                  {roomImages.map((image, index) => (
                    <div key={image.id} className='relative'>
                      <button
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
                      <button
                        onClick={() => {
                          setCurrentImageIndex(index)
                          setShowFullGallery(false)
                          openImageEditor(image)
                        }}
                        className='bg-[#D4A017] text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-[#E6B52C]'
                        title='Edit image'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-2 w-2'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() => {
                          setImageToDelete(image)
                          setShowDeleteConfirm(true)
                        }}
                        className='absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-700'
                        title='Delete image'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-3 w-3'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click()
                      }
                    }}
                    className='flex-shrink-0 h-16 w-16 rounded-md border-2 border-dashed border-[#D4A017] flex items-center justify-center hover:bg-[#2D2D2D] transition-colors'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6 text-[#D4A017]'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                  </button>
                </div>

                <div className='mt-2 flex justify-between items-center'>
                  <div className='text-sm text-[#CCCCCC]'>
                    Image {currentImageIndex + 1} of {roomImages.length}
                  </div>

                  <div className='text-xs text-[#CCCCCC]'>
                    {roomImages[currentImageIndex]?.createdAt && (
                      <>
                        Added:{' '}
                        {new Date(
                          roomImages[currentImageIndex].createdAt
                        ).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto'>
          <div className='bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-bold text-[#FFFFFF] mb-2'>
              Delete Image
            </h3>

            <p className='text-[#CCCCCC] mb-4'>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>

            {imageToDelete && (
              <div className='relative h-40 w-full mb-4 rounded overflow-hidden'>
                <Image
                  src={imageToDelete.url}
                  alt='Image to delete'
                  fill
                  style={{ objectFit: 'contain', backgroundColor: '#2D2D2D' }}
                />
              </div>
            )}

            <div className='flex space-x-3'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='flex-1 py-2 bg-[#2D2D2D] text-[#FFFFFF] rounded-md hover:bg-[#3D3D3D] transition-colors'
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteImage}
                className='flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
{showImageEditor && selectedImageToEdit && (
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
              src={selectedImageToEdit.url} 
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

      {/* Hidden file input for uploads */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept='image/*'
        className='hidden'
      />

      <input
        type='file'
        ref={replaceFileInputRef}
        onChange={handleReplaceImage}
        accept='image/*'
        className='hidden'
      />
    </div>
  )
}
