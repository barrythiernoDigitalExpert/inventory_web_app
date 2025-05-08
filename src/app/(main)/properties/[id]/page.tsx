'use client'

import { use, useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react';

// Services
import {
  fetchPropertyById,
  fetchPropertyRooms,
  fetchImagesByRoom,
  Property
} from '@/lib/services/propertyService'
import {
  RoomImage,
  deleteRoomImage,
  uploadRoomImages,
  updateRoomImage,
  setMainRoomImage,
  updateImageMetadata
} from '@/lib/services/roomImageService'

// Components
import PropertySidebar from '@/components/property/PropertySidebar'
import ImageEditor from '@/components/property/ImageEditor'
import DeleteConfirmDialog from '@/components/property/DeleteConfirmDialog'
import FullGalleryModal from '@/components/property/FullGalleryModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoomGrid from '@/components/property/RoomGrid'
import EditDescriptionModal from '@/components/property/EditDescriptionModal'
// Types
interface Room {
  id: string
  code: string
  name: string
  image: string
  imageCount: number
  hasImages?: boolean
}

export default function PropertyDetailPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // State
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [roomImages, setRoomImages] = useState<RoomImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRoomImagesLoading, setIsRoomImagesLoading] = useState(false)

  // Modal states
  const [showFullGallery, setShowFullGallery] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<RoomImage | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageToReplace, setImageToReplace] = useState<RoomImage | null>(null)

  // Image editor states
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
  const [cropPreviewData, setCropPreviewData] = useState<string | null>(null)
  const [adjustPreviewData, setAdjustPreviewData] = useState<string | null>(
    null
  )
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [pendingOperations, setPendingOperations] = useState<
    Array<{ type: 'crop' | 'adjust' | 'rotate'; data: any }>
  >([])

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const imageEditorRef = useRef<HTMLDivElement>(null)

  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false)
  const [imageToEditDescription, setImageToEditDescription] =
    useState<RoomImage | null>(null)
  const [descriptionValue, setDescriptionValue] = useState('')

  // Router and ID
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession(); // Adjust based on your auth system
  const user = {
    id: session?.user?.id,
    role: session?.user?.role,
    email: session?.user?.email // Make sure this email is included
  };

  // Load property details on mount
  useEffect(() => {
    loadPropertyDetails()
  }, [id])

  // Filter rooms when search term changes
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

  // Load room images when selected room changes
  useEffect(() => {
    if (selectedRoom) {
      loadRoomImages(selectedRoom)
    }
  }, [selectedRoom])

  // Methods
  const loadPropertyDetails = async () => {
    try {
      setIsLoading(true)
      const propertyData = await fetchPropertyById(id)
      setProperty(propertyData)

      const roomsData = await fetchPropertyRooms(id)

      // Sort rooms by image count and name
      const sortedRooms = [...roomsData].sort((a, b) => {
        if (a.imageCount !== b.imageCount) {
          return b.imageCount - a.imageCount
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

  const loadRoomImages = async (roomId: string) => {
    try {
      setIsRoomImagesLoading(true)
      const roomImagesData = await fetchImagesByRoom(roomId)
      console.log(roomImagesData)

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

  const updateRoomImageCount = (roomId: string, changeAmount: number) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId
          ? { ...room, imageCount: Math.max(0, room.imageCount + changeAmount) }
          : room
      )
    )
  }
  const handleEditDescription = (image: RoomImage) => {
    setImageToEditDescription(image)
    setDescriptionValue(image.description || '')
    setShowDescriptionEditor(true)
  }
  const saveImageDescription = async () => {
    if (!imageToEditDescription || !selectedRoom) return

    const toastId = toast.loading('Updating description...')
    try {
      // Use the existing updateImageMetadata function
      const updatedImage = await updateImageMetadata(
        id,
        selectedRoom,
        imageToEditDescription.id,
        { description: descriptionValue }
      )

      if (updatedImage) {
        // Update local state with new description
        setRoomImages(prevImages =>
          prevImages.map(img =>
            img.id === imageToEditDescription.id
              ? { ...img, description: descriptionValue }
              : img
          )
        )

        setShowDescriptionEditor(false)
        toast.dismiss(toastId)
        toast.success('Description updated successfully')
      } else {
        toast.dismiss(toastId)
        toast.error('Failed to update description')
      }
    } catch (error) {
      console.error('Error updating description:', error)
      toast.dismiss(toastId)
      toast.error('Failed to update description')
    }
  }

  const handleDeleteImage = async () => {
    if (!imageToDelete || !selectedRoom) return

    try {
      const success = await deleteRoomImage(id, selectedRoom, imageToDelete.id)
      if (success) {
        updateRoomImageCount(selectedRoom, -1)

        // Update images list locally
        setRoomImages(prevImages =>
          prevImages.filter(img => img.id !== imageToDelete.id)
        )

        setShowDeleteConfirm(false)
        setImageToDelete(null)

        // Adjust current index if needed
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedRoom) return

    const toastId = toast.loading('Uploading images...')
    try {
      const uploadedImages = await uploadRoomImages(
        id,
        selectedRoom,
        Array.from(files)
      )

      if (uploadedImages) {
        updateRoomImageCount(selectedRoom, uploadedImages.length)
        setRoomImages(prevImages => [...prevImages, ...uploadedImages])

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        toast.dismiss(toastId)
        toast.success(`${files.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.dismiss(toastId)
      toast.error('Failed to upload images')
    }
  }

  const handleReplaceImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0 || !imageToReplace || !selectedRoom) return

    const toastId = toast.loading('Replacing image...')
    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const updatedImage = await updateRoomImage(
            id,
            selectedRoom,
            imageToReplace.id,
            reader.result
          )

          if (updatedImage) {
            // Allow time for Cloudinary processing
            await new Promise(resolve => setTimeout(resolve, 800))

            // Refresh images
            await loadRoomImages(selectedRoom)

            toast.dismiss(toastId)
            toast.success('Image replaced successfully')
          } else {
            toast.dismiss(toastId)
            toast.error('Failed to replace image')
          }
        }
      }

      reader.readAsDataURL(files[0])

      // Reset file input
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = ''
      }
      setImageToReplace(null)
    } catch (error) {
      console.error('Error replacing image:', error)
      toast.dismiss(toastId)
      toast.error('Failed to replace image')
    }
  }

  const openImageEditor = (image: RoomImage) => {
    setSelectedImageToEdit(image)
    setShowImageEditor(true)
    resetEditorState()
  }

  const closeImageEditor = () => {
    if (hasPendingChanges) {
      if (
        window.confirm(
          'You have unsaved changes. Are you sure you want to close without saving?'
        )
      ) {
        resetEditorState()
        setShowImageEditor(false)
      }
    } else {
      resetEditorState()
      setShowImageEditor(false)
    }
  }

  const resetEditorState = () => {
    setImageRotation(0)
    setCropMode(false)
    setShowAdjustControls(false)
    setBrightness(100)
    setContrast(100)
    setIsDragging(false)
    setCropRect({ x: 20, y: 20, width: 200, height: 200 })
    setHasPendingChanges(false)
    setPendingOperations([])
    setCropPreviewData(null)
    setAdjustPreviewData(null)
  }

  const rotateImage = (direction: 'left' | 'right') => {
    const newRotation =
      direction === 'right'
        ? (imageRotation + 90) % 360
        : (imageRotation - 90 + 360) % 360

    setImageRotation(newRotation)
    setPendingOperations(prev => [
      ...prev,
      {
        type: 'rotate',
        data: { rotation: newRotation }
      }
    ])

    setHasPendingChanges(true)
    toast.success('Rotation applied! Click "Finish" to save changes.')
  }

  const applyCropPreview = () => {
    if (!selectedImageToEdit || !cropMode) {
      setCropMode(false)
      return
    }

    // Ensure this runs on client side
    if (typeof window === 'undefined') return

    try {
      const canvas = document.createElement('canvas')
      const imgElement = new window.Image()
      imgElement.crossOrigin = 'anonymous'

      imgElement.onload = async () => {
        const editorElement = imageEditorRef.current
        if (!editorElement) return

        const editorRect = editorElement.getBoundingClientRect()
        const displayWidth = editorRect.width
        const displayHeight = editorRect.height
        const imgRatio = imgElement.width / imgElement.height
        const containerRatio = displayWidth / displayHeight

        // Calculate image dimensions and position
        let imgWidth, imgHeight, offsetX, offsetY
        if (imgRatio > containerRatio) {
          imgWidth = displayWidth
          imgHeight = displayWidth / imgRatio
          offsetX = 0
          offsetY = (displayHeight - imgHeight) / 2
        } else {
          imgHeight = displayHeight
          imgWidth = displayHeight * imgRatio
          offsetX = (displayWidth - imgWidth) / 2
          offsetY = 0
        }

        // Calculate crop coordinates
        const scaleX = imgElement.width / imgWidth
        const scaleY = imgElement.height / imgHeight
        const cropX = (cropRect.x - offsetX) * scaleX
        const cropY = (cropRect.y - offsetY) * scaleY
        const cropWidth = cropRect.width * scaleX
        const cropHeight = cropRect.height * scaleY

        // Configure canvas
        canvas.width = cropWidth
        canvas.height = cropHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Handle rotation if necessary
        if (imageRotation !== 0) {
          if (imageRotation === 90 || imageRotation === 270) {
            canvas.width = cropHeight
            canvas.height = cropWidth
          }

          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((imageRotation * Math.PI) / 180)

          const drawX =
            imageRotation === 90 || imageRotation === 270
              ? -cropHeight / 2
              : -cropWidth / 2
          const drawY =
            imageRotation === 90 || imageRotation === 270
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

        const croppedDataURL = canvas.toDataURL('image/jpeg', 0.92)
        setCropPreviewData(croppedDataURL)
        setPendingOperations(prev => [
          ...prev,
          {
            type: 'crop',
            data: {
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              rotation: imageRotation,
              croppedDataURL
            }
          }
        ])

        setHasPendingChanges(true)
        setCropMode(false)
        toast.success('Crop applied! Click "Finish" to save changes.')
      }

      // Load source image with cache busting
      const cacheBustUrl =
        cropPreviewData ||
        (selectedImageToEdit.url.includes('?')
          ? selectedImageToEdit.url
          : `${selectedImageToEdit.url}?t=${Date.now()}`)

      imgElement.src = cacheBustUrl
    } catch (error) {
      console.error('Error during cropping:', error)
      toast.error('Error processing image')
      setCropMode(false)
    }
  }

  const applyAdjustmentsPreview = () => {
    if (!selectedImageToEdit) return

    // Ensure this runs on client side
    if (typeof window === 'undefined') return

    try {
      const canvas = document.createElement('canvas')
      const imgElement = new window.Image()
      imgElement.crossOrigin = 'anonymous'

      imgElement.onload = async () => {
        canvas.width = imgElement.width
        canvas.height = imgElement.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Draw original image
        ctx.drawImage(imgElement, 0, 0)

        // Apply filters
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
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

        ctx.putImageData(imageData, 0, 0)
        const adjustedDataURL = canvas.toDataURL('image/jpeg', 0.92)

        setAdjustPreviewData(adjustedDataURL)
        setPendingOperations(prev => [
          ...prev,
          {
            type: 'adjust',
            data: {
              brightness,
              contrast,
              adjustedDataURL
            }
          }
        ])

        setHasPendingChanges(true)
        setShowAdjustControls(false)
        toast.success('Adjustments applied! Click "Finish" to save changes.')
      }

      // Load source image with cache busting
      const cacheBustUrl =
        adjustPreviewData ||
        cropPreviewData ||
        (selectedImageToEdit.url.includes('?')
          ? selectedImageToEdit.url
          : `${selectedImageToEdit.url}?t=${Date.now()}`)

      imgElement.src = cacheBustUrl
    } catch (error) {
      console.error('Error during adjustment:', error)
      toast.error('Error processing image')
      setShowAdjustControls(false)
    }
  }

  const saveAllChangesToCloudinary = async () => {
    if (!selectedImageToEdit || !selectedRoom || !hasPendingChanges) return

    const toastId = toast.loading('Saving changes to Cloudinary...')
    try {
      // Get the last operation result
      const lastOperation = pendingOperations[pendingOperations.length - 1]
      let finalImageData

      if (lastOperation.type === 'crop') {
        finalImageData = lastOperation.data.croppedDataURL
      } else if (lastOperation.type === 'adjust') {
        finalImageData = lastOperation.data.adjustedDataURL
      } else {
        // For rotation only, create rotated image
        const rotationCanvas = document.createElement('canvas')
        const imgElement = new window.Image()
        imgElement.crossOrigin = 'anonymous'

        await new Promise<void>(resolve => {
          imgElement.onload = () => {
            const rotation = lastOperation.data.rotation
            let canvasWidth = imgElement.width
            let canvasHeight = imgElement.height

            if (rotation === 90 || rotation === 270) {
              canvasWidth = imgElement.height
              canvasHeight = imgElement.width
            }

            rotationCanvas.width = canvasWidth
            rotationCanvas.height = canvasHeight
            const ctx = rotationCanvas.getContext('2d')
            if (ctx) {
              ctx.save()
              ctx.translate(canvasWidth / 2, canvasHeight / 2)
              ctx.rotate((rotation * Math.PI) / 180)
              ctx.drawImage(
                imgElement,
                -imgElement.width / 2,
                -imgElement.height / 2
              )
              ctx.restore()
            }
            resolve()
          }
          imgElement.src =
            adjustPreviewData || cropPreviewData || selectedImageToEdit.url
        })

        finalImageData = rotationCanvas.toDataURL('image/jpeg', 0.92)
      }

      // Send to API
      const updatedImage = await updateRoomImage(
        id,
        selectedRoom,
        selectedImageToEdit.id,
        finalImageData
      )

      if (updatedImage) {
        // Allow time for Cloudinary processing
        await new Promise(resolve => setTimeout(resolve, 800))

        // Refresh images
        await loadRoomImages(selectedRoom)

        toast.dismiss(toastId)
        toast.success('All changes saved successfully!')

        // Reset states
        setHasPendingChanges(false)
        setPendingOperations([])
        setCropPreviewData(null)
        setAdjustPreviewData(null)
        setShowImageEditor(false)
      } else {
        toast.dismiss(toastId)
        toast.error('Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.dismiss(toastId)
      toast.error('Error saving changes')
    }
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

    // Resize function for mouse movement
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

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Property not found
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

  const currentRoom = rooms.find(room => room.id === selectedRoom)

  return (
    <div className='space-y-6'>
      {/* Header */}
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
          className='btn btn-primary flex items-center'
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

      {/* Main content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Property sidebar */}
        <PropertySidebar property={property} currentUser={user} />

        {/* Rooms & Images Section */}
        <div className='lg:col-span-2'>
          <div className='card-gold'>
            <h2 className='text-xl font-bold text-[#FFFFFF] mb-4'>
              Rooms & Images
            </h2>

            {/* Search & filter */}
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
                  // Continuing PropertyDetailPage component
                  className='pl-10 pr-4 py-2 w-full text-sm rounded-md bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#D4A017] focus:outline-none text-[#FFFFFF]'
                />
              </div>
              <div className='text-[#CCCCCC] text-sm ml-2'>
                {filteredRooms.length} of {rooms.length} rooms
              </div>
            </div>

            {/* Room selection and image display */}
            <div className='flex flex-col lg:flex-row gap-4 lg:gap-6'>
              {/* Room grid */}
              <RoomGrid
                rooms={filteredRooms}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
              />

              {/* Room content - images */}
              <div
                className='lg:w-2/3 bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto'
                style={{ maxHeight: '500px' }}
              >
                {selectedRoom ? (
                  <>
                    {/* Room header */}
                    <div className='flex items-center justify-between mb-4 pb-2 border-b border-[#2D2D2D]'>
                      <div className='flex items-center'>
                        <h3 className='text-lg font-bold text-[#FFFFFF]'>
                          {currentRoom?.name}
                        </h3>
                        <span className='ml-2 px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full'>
                          {currentRoom?.imageCount}{' '}
                          {currentRoom?.imageCount === 1 ? 'image' : 'images'}
                        </span>
                      </div>

                      <div className='flex items-center space-x-2'>
                        {/* Add images button */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
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

                        {/* Show all photos button */}
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

                    {/* Main image display */}
                    <div className='relative h-60 w-full rounded-lg overflow-hidden mb-4'>
                      {isRoomImagesLoading ? (
                        <LoadingSpinner size='sm' />
                      ) : roomImages.length > 0 ? (
                        <div className='relative h-full w-full'>
                          <Image
                            src={
                              roomImages[currentImageIndex]?.url ||
                              '/images/room-placeholder.jpg'
                            }
                            alt={currentRoom?.name || ''}
                            fill
                            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                            priority={currentImageIndex === 0}
                            style={{
                              objectFit: 'contain',
                              backgroundColor: '#2D2D2D'
                            }}
                            placeholder='blur'
                            blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=='
                          />

                          {/* Image action buttons */}
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
                              onClick={() =>
                                handleEditDescription(
                                  roomImages[currentImageIndex]
                                )
                              }
                              className='p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white'
                              title='Edit description'
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
                                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setImageToReplace(roomImages[currentImageIndex])
                                replaceFileInputRef.current?.click()
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

                          {/* Image navigation controls */}
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

                          {/* Image counter */}
                          <div className='absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white'>
                            {currentImageIndex + 1} / {roomImages.length}
                          </div>
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center h-full bg-[#2D2D2D]'>
                          <button
                            onClick={() => fileInputRef.current?.click()}
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

                    {/* Image thumbnails */}
                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <h4 className='text-sm font-medium text-[#D4A017]'>
                          Room Images
                        </h4>
                        {roomImages.length > 8 && (
                          <span className='text-xs text-[#CCCCCC]'>
                            Showing {Math.min(8, roomImages.length)} of{' '}
                            {roomImages.length} images
                          </span>
                        )}
                      </div>

                      {isRoomImagesLoading ? (
                        <LoadingSpinner size='sm' />
                      ) : roomImages.length > 0 ? (
                        <div className='space-y-3'>
                          {/* Image thumbnail list */}
                          {roomImages.slice(0, 8).map((image, index) => {
                            const descriptions = [
                              'Main view of the room',
                              'Corner view highlighting details',
                              'Window view showing lighting',
                              'Close-up of special features',
                              'Detailed view of furnishings'
                            ]
                            const description =
                              image.description ||
                              descriptions[index % descriptions.length]

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
                                    alt={`Image ${index + 1}`}
                                    fill
                                    sizes='64px'
                                    style={{ objectFit: 'cover' }}
                                    className='rounded'
                                    placeholder='blur'
                                    blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJMAP4xMZa5AAAAABJRU5ErkJggg=='
                                  />

                                  {/* Thumbnail action buttons */}
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
                                        handleEditDescription(image)
                                      }}
                                      className='p-1 rounded-full bg-blue-600 text-white hover:bg-blue-700'
                                      title='Edit description'
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
                                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
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
                                      {image.isMainImage
                                        ? 'Main Image'
                                        : `Image ${index + 1}`}
                                    </h3>

                                    <span className='text-xs px-2 py-0.5 rounded-full text-white bg-blue-600'>
                                      Photo
                                    </span>
                                  </div>

                                  <p className='text-sm text-[#CCCCCC] mt-1'>
                                    {description}
                                  </p>
                                </div>
                              </div>
                            )
                          })}

                          {/* View all images button */}
                          {roomImages.length > 8 && (
                            <button
                              onClick={() => setShowFullGallery(true)}
                              className='w-full py-2 rounded-md bg-[#2D2D2D] text-[#D4A017] text-sm hover:bg-[#3D3D3D] transition-colors'
                            >
                              View all {roomImages.length} images in gallery
                            </button>
                          )}

                          {/* Add more images button */}
                          <button
                            onClick={() => fileInputRef.current?.click()}
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
                            onClick={() => fileInputRef.current?.click()}
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
                      Select a room to view its images
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Gallery Modal */}
      {showFullGallery && selectedRoom && (
        <FullGalleryModal
          roomName={currentRoom?.name || ''}
          images={roomImages}
          currentIndex={currentImageIndex}
          setCurrentIndex={setCurrentImageIndex}
          isLoading={isRoomImagesLoading}
          onClose={() => setShowFullGallery(false)}
          onEdit={openImageEditor}
          onReplace={image => {
            setImageToReplace(image)
            replaceFileInputRef.current?.click()
          }}
          onDelete={image => {
            setImageToDelete(image)
            setShowDeleteConfirm(true)
          }}
          onAddImages={() => fileInputRef.current?.click()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          image={imageToDelete}
          onConfirm={handleDeleteImage}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {showDescriptionEditor && imageToEditDescription && (
        <EditDescriptionModal
          image={imageToEditDescription}
          description={descriptionValue}
          onDescriptionChange={setDescriptionValue}
          onSave={saveImageDescription}
          onCancel={() => setShowDescriptionEditor(false)}
        />
      )}

      {/* Image Editor Modal */}
      {showImageEditor && selectedImageToEdit && (
        <ImageEditor
          image={selectedImageToEdit}
          editorRef={imageEditorRef}
          cropMode={cropMode}
          setCropMode={setCropMode}
          cropRect={cropRect}
          setCropRect={setCropRect}
          brightness={brightness}
          setBrightness={setBrightness}
          contrast={contrast}
          setContrast={setContrast}
          showAdjustControls={showAdjustControls}
          setShowAdjustControls={setShowAdjustControls}
          imageRotation={imageRotation}
          hasPendingChanges={hasPendingChanges}
          cropPreviewData={cropPreviewData}
          adjustPreviewData={adjustPreviewData}
          onClose={closeImageEditor}
          onRotateLeft={() => rotateImage('left')}
          onRotateRight={() => rotateImage('right')}
          onApplyCrop={applyCropPreview}
          onApplyAdjustments={applyAdjustmentsPreview}
          onSaveChanges={saveAllChangesToCloudinary}
          onCropMouseDown={handleCropMouseDown}
          onCropMouseMove={handleCropMouseMove}
          onCropMouseUp={handleCropMouseUp}
          onResizeCrop={handleResizeCrop}
        />
      )}

      {/* Hidden file inputs */}
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
