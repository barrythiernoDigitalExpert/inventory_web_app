// components/property/FullGalleryModal.tsx
'use client'

import { RoomImage } from '@/lib/services/roomImageService'
import Image from 'next/image'
import { useState } from 'react'


interface FullGalleryModalProps {
  roomName: string
  images: RoomImage[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
  isLoading: boolean
  onClose: () => void
  onEdit: (image: RoomImage) => void
  onReplace: (image: RoomImage) => void
  onDelete: (image: RoomImage) => void
  onAddImages: () => void
}

const FullGalleryModal: React.FC<FullGalleryModalProps> = ({
  roomName,
  images,
  currentIndex,
  setCurrentIndex,
  isLoading,
  onClose,
  onEdit,
  onReplace,
  onDelete,
  onAddImages
}) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="relative bg-[#1E1E1E] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex items-center justify-center">
          <div className="text-[#D4A017]">
            <svg
              className="animate-spin h-8 w-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative bg-[#1E1E1E] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#FFFFFF]">
            {roomName} - Gallery ({images.length} photos)
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={onAddImages}
              className="flex items-center text-[#D4A017] hover:text-[#E6B52C]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Images
            </button>
            <button
              onClick={onClose}
              className="text-[#CCCCCC] hover:text-[#FFFFFF]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
        </div>

        <div className="relative h-[60vh]">
          {images.length > 0 ? (
            <>
              <Image
                src={
                  images[currentIndex]?.url ||
                  '/images/room-placeholder.jpg'
                }
                alt={roomName || ''}
                fill
                style={{ objectFit: 'contain' }}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=="
              />

              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => onEdit(images[currentIndex])}
                  className="p-2 rounded-md bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white"
                  title="Edit this image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => onReplace(images[currentIndex])}
                  className="p-2 rounded-md bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white"
                  title="Replace this image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(images[currentIndex])}
                  className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
                  title="Delete this image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentIndex(
                        currentIndex === 0 ? images.length - 1 : currentIndex - 1
                      )
                    }
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() =>
                      setCurrentIndex(
                        currentIndex === images.length - 1 ? 0 : currentIndex + 1
                      )
                    }
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <button
                onClick={onAddImages}
                className="p-6 rounded-full bg-[#2D2D2D] border-2 border-dashed border-[#D4A017] hover:bg-[#3D3D3D] transition-colors mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-[#D4A017]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <p className="text-[#CCCCCC]">No images available for this room</p>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="p-4 border-t border-[#2D2D2D]">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {images.map((image, index) => (
                <div key={image.id} className="relative">
                  <button
                    onClick={() => setCurrentIndex(index)}
                    className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 ${
                      index === currentIndex
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
                  <div className="absolute -top-1 -right-1 flex space-x-1">
                    <button
                      onClick={() => {
                        setCurrentIndex(index);
                        onEdit(image);
                      }}
                      className="bg-[#D4A017] text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-[#E6B52C]"
                      title="Edit image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-2 w-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(image)}
                      className="bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-700"
                      title="Delete image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
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
                </div>
              ))}

              <button
                onClick={onAddImages}
                className="flex-shrink-0 h-16 w-16 rounded-md border-2 border-dashed border-[#D4A017] flex items-center justify-center hover:bg-[#2D2D2D] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#D4A017]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <div className="text-sm text-[#CCCCCC]">
                Image {currentIndex + 1} of {images.length}
              </div>

              <div className="text-xs text-[#CCCCCC]">
                {images[currentIndex]?.createdAt && (
                  <>
                    Added:{' '}
                    {new Date(
                      images[currentIndex].createdAt
                    ).toLocaleDateString()}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FullGalleryModal