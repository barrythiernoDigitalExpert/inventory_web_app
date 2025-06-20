// components/property/DeleteConfirmDialog.tsx
'use client'

import { RoomImage } from '@/lib/services/roomImageService'
import Image from 'next/image'


interface DeleteConfirmDialogProps {
  image: RoomImage | null
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  image,
  onConfirm,
  onCancel
}) => {
  if (!image) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">
          Delete Image
        </h3>

        <p className="text-[#CCCCCC] mb-4">
          Are you sure you want to delete this image? This action cannot be
          undone.
        </p>

        <div className="relative h-40 w-full mb-4 rounded overflow-hidden">
          <Image
            src={image.url}
            alt="Image to delete"
            fill
            style={{ objectFit: 'contain', backgroundColor: '#2D2D2D' }}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-[#2D2D2D] text-[#FFFFFF] rounded-md hover:bg-[#3D3D3D] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmDialog