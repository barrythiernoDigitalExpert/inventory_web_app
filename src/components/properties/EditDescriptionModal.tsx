// components/property/EditDescriptionModal.js
'use client'

import React, { useRef, useEffect } from 'react'
import Image from 'next/image'
import { RoomImage } from '@/lib/services/roomImageService';

interface EditDescriptionModalProps {
  image: RoomImage;
  description: string;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Modal component for editing image descriptions
 * 
 * @param {Object} image - The image object being edited
 * @param {String} description - Current description value
 * @param {Function} onDescriptionChange - Handler for description changes
 * @param {Function} onSave - Handler for saving the description
 * @param {Function} onCancel - Handler for canceling the edit
 */
const EditDescriptionModal: React.FC<EditDescriptionModalProps> = ({
  image,
  description,
  onDescriptionChange,
  onSave,
  onCancel
}) =>{

  const modalRef = useRef<HTMLDivElement | null>(null)
const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Focus textarea on open
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event : MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onCancel])

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event : KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [onCancel])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-[#1E1E1E] rounded-lg max-w-lg w-full shadow-xl relative"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2D2D2D]">
          <h3 className="text-lg font-bold text-[#FFFFFF]">Edit Image Description</h3>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#CCCCCC] hover:text-white"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Image preview */}
          <div className="mb-4 flex items-center">
            <div className="relative h-16 w-16 flex-shrink-0 mr-3">
              <Image
                src={image.url}
                alt="Image preview"
                fill
                sizes="64px"
                style={{ objectFit: 'cover' }}
                className="rounded"
              />
            </div>
            <div>
              <h4 className="text-[#FFFFFF] font-medium">
                {image.isMainImage ? 'Main Image' : 'Room Image'}
              </h4>
              <p className="text-xs text-[#CCCCCC]">
                Describe what's shown in this image
              </p>
            </div>
          </div>

          {/* Description textarea */}
          <div className="mb-4">
            <label 
              htmlFor="image-description" 
              className="block text-sm font-medium text-[#D4A017] mb-2"
            >
              Description
            </label>
            <textarea
              ref={textareaRef}
              id="image-description"
              rows={4}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter a description for this image (e.g., 'Main view of the living room showing the fireplace and windows')"
              className="w-full px-3 py-2 text-white bg-[#2D2D2D] rounded-md border border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-[#D4A017] focus:border-[#D4A017]"
            />
            <p className="mt-1 text-xs text-[#CCCCCC]">
              Clear descriptions help identify images in reports and inventories
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2D2D2D] flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#3D3D3D]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-md bg-[#D4A017] text-black hover:bg-[#E6B52C]"
          >
            Save Description
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditDescriptionModal