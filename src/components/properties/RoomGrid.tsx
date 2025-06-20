// components/property/RoomGrid.tsx
'use client'

import Image from 'next/image'

interface Room {
  id: string
  code: string
  name: string
  image: string
  imageCount: number
  hasImages?: boolean
}

interface RoomGridProps {
  rooms: Room[]
  selectedRoom: string | null
  onSelectRoom: (roomId: string) => void
}

const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom
}) => {
  return (
    <div
      className="lg:w-1/3 overflow-y-auto pr-1"
      style={{ maxHeight: '500px' }}
    >
      <div className="grid grid-cols-2 gap-2">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
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
                  objectFit: !room.image ? 'contain' : 'cover',
                  backgroundColor: !room.image ? '#2D2D2D' : 'transparent'
                }}
                className={`transition-all ${
                  selectedRoom === room.id
                    ? 'brightness-110'
                    : 'brightness-75 hover:brightness-100'
                }`}
              />
              {room.hasImages && (
                <div className="absolute top-1 right-1 bg-[#D4A017] rounded-full p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-[#1E1E1E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <span
              className={`text-xs font-medium leading-tight text-center ${
                selectedRoom === room.id ? 'text-[#D4A017]' : 'text-[#FFFFFF]'
              }`}
            >
              {room.name}
            </span>
            <span className="text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full px-2 py-0.5 mt-1">
              {room.imageCount} {room.imageCount === 1 ? 'item' : 'items'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default RoomGrid