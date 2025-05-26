import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

// Types
interface Property {
  id: string
  name: string
  address?: string
  image?: string
  listingPerson?: string
  [key: string]: any
}

interface FormDataType {
  address: string
  listingPerson: string
  image: string
}

interface MissingFieldsModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: Partial<FormDataType>) => Promise<void>
  missingFields: string[]
}

export default function MissingFieldsModal({
  property,
  isOpen,
  onClose,
  onUpdate,
  missingFields
}: MissingFieldsModalProps) {
  const [formData, setFormData] = useState<FormDataType>({
    address: property?.address || '',
    listingPerson: property?.listingPerson || '',
    image: property?.image || ''
  })
  const [imagePreview, setImagePreview] = useState<string>(property?.image || '')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (property) {
      setFormData({
        address: property.address || '',
        listingPerson: property.listingPerson || '',
        image: property.image || ''
      })
      setImagePreview(property.image || '')
    }
  }, [property])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData({ ...formData, image: base64String })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare data for submission
      const updateData: Partial<FormDataType> = {}
      
      if (missingFields.includes('address')) {
        updateData.address = formData.address
      }
      
      if (missingFields.includes('listingPerson')) {
        updateData.listingPerson = formData.listingPerson
      }
      
      if (missingFields.includes('image')) {
        updateData.image = formData.image
      }

      // Call the onUpdate function with the updated data
      await onUpdate(updateData)
      
      onClose()
      toast.success('Property updated successfully')
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error('Failed to update property')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#FFFFFF]">Complete Required Fields</h2>
          <button
            onClick={onClose}
            className="text-[#CCCCCC] hover:text-[#FFFFFF]"
            type="button"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-[#CCCCCC] mb-4">
            Please complete the following required fields before generating the PDF.
          </p>

          {/* Address Field */}
          {missingFields.includes('address') && (
            <div>
              <label htmlFor="address" className="block text-[#CCCCCC] text-sm font-medium mb-2">
                Property Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required={missingFields.includes('address')}
                className="w-full p-2 bg-[#2D2D2D] border border-[#3D3D3D] rounded-md text-[#FFFFFF] focus:border-[#D4A017] focus:outline-none"
                placeholder="Enter property address"
              />
            </div>
          )}

          {/* Listing Person Field */}
          {missingFields.includes('listingPerson') && (
            <div>
              <label htmlFor="listingPerson" className="block text-[#CCCCCC] text-sm font-medium mb-2">
                Name of Listing Person *
              </label>
              <input
                type="text"
                id="listingPerson"
                name="listingPerson"
                value={formData.listingPerson}
                onChange={handleInputChange}
                required={missingFields.includes('listingPerson')}
                className="w-full p-2 bg-[#2D2D2D] border border-[#3D3D3D] rounded-md text-[#FFFFFF] focus:border-[#D4A017] focus:outline-none"
                placeholder="Enter name of listing person"
              />
            </div>
          )}

          {/* Property Image Field */}
          {missingFields.includes('image') && (
            <div>
              <label htmlFor="propertyImage" className="block text-[#CCCCCC] text-sm font-medium mb-2">
                Property Image *
              </label>
              
              {imagePreview ? (
                <div className="relative h-40 w-full mb-2">
                  <Image
                    src={imagePreview}
                    alt="Property preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-md"
                  />
                </div>
              ) : (
                <div className="h-40 w-full bg-[#2D2D2D] rounded-md flex items-center justify-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-[#CCCCCC]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="propertyImage"
                  className="flex flex-col items-center justify-center w-full h-12 border-2 border-dashed border-[#D4A017] rounded-md cursor-pointer bg-[#2D2D2D] hover:bg-[#3D3D3D] transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4A017] mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-[#D4A017]">
                      {imagePreview ? "Change image" : "Upload image"}
                    </span>
                  </div>
                  <input
                    id="propertyImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    required={missingFields.includes('image') && !imagePreview}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#FFFFFF] bg-[#3D3D3D] hover:bg-[#4D4D4D] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-black bg-[#D4A017] hover:bg-[#E6B52C] rounded-md transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}