// components/property/ImageEditor.tsx
'use client'

import { RefObject } from 'react'
import Image from 'next/image'
import { RoomImage } from '@/lib/services/roomImageService'



interface ImageEditorProps {
  image: RoomImage
  editorRef: RefObject<HTMLDivElement | null>
  cropMode: boolean
  setCropMode: (value: boolean) => void
  cropRect: { x: number; y: number; width: number; height: number }
  setCropRect: (value: { x: number; y: number; width: number; height: number }) => void
  brightness: number
  setBrightness: (value: number) => void
  contrast: number
  setContrast: (value: number) => void
  showAdjustControls: boolean
  setShowAdjustControls: (value: boolean) => void
  imageRotation: number
  hasPendingChanges: boolean
  cropPreviewData: string | null
  adjustPreviewData: string | null
  onClose: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onApplyCrop: () => void
  onApplyAdjustments: () => void
  onSaveChanges: () => void
  onCropMouseDown: (e: React.MouseEvent) => void
  onCropMouseMove: (e: React.MouseEvent) => void
  onCropMouseUp: () => void
  onResizeCrop: (direction: string, e: React.MouseEvent) => void
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  image,
  editorRef,
  cropMode,
  setCropMode,
  cropRect,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  showAdjustControls,
  setShowAdjustControls,
  imageRotation,
  hasPendingChanges,
  cropPreviewData,
  adjustPreviewData,
  onClose,
  onRotateLeft,
  onRotateRight,
  onApplyCrop,
  onApplyAdjustments,
  onSaveChanges,
  onCropMouseDown,
  onCropMouseMove,
  onCropMouseUp,
  onResizeCrop
}) => {
  // Get the current image source (original or edited)
  const getCurrentImageSource = () => {
    if (adjustPreviewData) return adjustPreviewData
    if (cropPreviewData) return cropPreviewData
    return image.url
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Image editor header */}
        <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#FFFFFF]">Edit Image</h2>
          <button 
            onClick={onClose}
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
            ref={editorRef}
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
                src={getCurrentImageSource()} 
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
                  onMouseDown={onCropMouseDown}
                  onMouseMove={onCropMouseMove}
                  onMouseUp={onCropMouseUp}
                  onMouseLeave={onCropMouseUp}
                >
                  {/* Resize handles */}
                  <div 
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize z-10"
                    onMouseDown={(e) => onResizeCrop('topLeft', e)}
                  ></div>
                  <div 
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full cursor-nesw-resize z-10"
                    onMouseDown={(e) => onResizeCrop('topRight', e)}
                  ></div>
                  <div 
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full cursor-nesw-resize z-10"
                    onMouseDown={(e) => onResizeCrop('bottomLeft', e)}
                  ></div>
                  <div 
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize z-10"
                    onMouseDown={(e) => onResizeCrop('bottomRight', e)}
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
              onClick={onRotateLeft}
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
              onClick={onRotateRight}
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
                  onApplyCrop();
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
                  onApplyAdjustments();
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
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#2D2D2D] text-[#CCCCCC] hover:bg-[#1E1E1E]"
          >
            Cancel
          </button>
          <button 
            onClick={onSaveChanges}
            className="px-4 py-2 rounded-md bg-[#D4A017] text-[#1E1E1E] hover:bg-[#B38A13]"
            disabled={!hasPendingChanges && !(cropMode || showAdjustControls)}
          >
            {cropMode ? 'Apply Crop' : 
              showAdjustControls ? 'Apply Adjustments' : 
              'Finish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageEditor