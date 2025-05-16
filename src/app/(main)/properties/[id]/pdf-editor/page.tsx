'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  fetchPropertyById,
  fetchPropertyRooms
} from '@/lib/services/propertyService'
import { fetchRoomImages } from '@/lib/services/roomImageService'
import { toast } from 'react-hot-toast'

interface ControlButtonsProps {
  id: string // Type explicite string au lieu de React.SetStateAction<string | null>
  content: {
    value: string
  }
}

interface SectionState {
  basic: boolean
  propertyInfo: boolean
}
interface DraggableItem {
  id: string
  type:
    | 'room'
    | 'image'
    | 'text'
    | 'heading'
    | 'logo'
    | 'property-info'
    | 'disclaimer'
    | 'property-field'
  content: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  editable?: boolean
  imageUrl?: string
  roomId?: string
  description?: string
  isResizing?: boolean
  page?: number
  isHeader?: boolean
  isRoomHeader?: boolean
}

export default function PDFEditorPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)

  const [property, setProperty] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [roomImages, setRoomImages] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [canvasItems, setCanvasItems] = useState<DraggableItem[]>([])
  const [activeDrag, setActiveDrag] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingText, setEditingText] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedRoomForImages, setSelectedRoomForImages] = useState<
    string | null
  >(null)
  const [resizingItem, setResizingItem] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
  const [sectionsOpen, setSectionsOpen] = useState({
    basic: true,
    propertyInfo: true
  })
  type SectionKey = keyof SectionState

  useEffect(() => {
    if (canvasItems.length > 0) {
      repositionDisclaimerOnResize()
    }
  }, [currentPage])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const propertyData = await fetchPropertyById(id)
        setProperty(propertyData)

        const roomsData = await fetchPropertyRooms(id)
        setRooms(roomsData)

        const imagesData: Record<string, any[]> = {}
        for (const room of roomsData) {
          const roomImages = await fetchRoomImages(id, room.id)
          imagesData[room.id] = roomImages
        }
        setRoomImages(imagesData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load property data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    const item = canvasItems.find(item => item.id === id)
    if (!item) return

    setActiveDrag(id)

    const element = e.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })

    setCanvasItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, zIndex: Math.max(...prev.map(i => i.zIndex)) + 1 }
          : item
      )
    )
  }

  const addRoomSectionsToCanvas = () => {
    // Nettoyer les éléments précédemment générés
    setCanvasItems(prev =>
      prev.filter(
        item =>
          !item.id.includes('room-title-') &&
          !item.id.includes('room-image-') &&
          !item.id.includes('room-desc-') &&
          !item.id.includes('room-no-images-') &&
          !item.id.includes('attractive-title-') &&
          !item.id.includes('disclaimer-page-') &&
          !item.id.includes('header-') &&
          !item.id.includes('cover-') &&
          !item.id.includes('summary-') &&
          !item.id.includes('room-intro-') &&
          !item.id.includes('page-number-')
      )
    )

    // Crée les nouveaux éléments à ajouter
    const newItems: DraggableItem[] = []
console.log(property);
    // ---- CRÉATION DE LA PAGE DE COUVERTURE (PAGE 1) ----

    // Ajout de l'en-tête "Inventário em estado de usado" également sur la page 1
    newItems.push({
      id: 'header-page-1',
      type: 'text',
      content: 'Inventário em estado de usado',
      position: { x: 0, y: 0 },
      size: { width: 800, height: 25 },
      zIndex: 20,
      page: 1,
      editable: true,
      isHeader: true
    })

    // Récupération d'une image principale de la propriété
    const mainImageUrl = getPropertyMainImage()
    const currentDate = new Date().toLocaleDateString()
    const totalRooms = rooms.length
    let totalImages = 0
    rooms.forEach(room => {
      const roomImgs = roomImages[room.id] || []
      totalImages += roomImgs.length
    })

    newItems.push({
      id: 'cover-main-title',
      type: 'heading',
      content: 'PROPERTY INVENTORY',
      position: { x: 100, y: 70 }, // Position Y augmentée pour descendre le titre (de 30 à 70)
      size: { width: 600, height: 80 }, // Taille agrandie (hauteur augmentée de 60 à 80, largeur de 500 à 600)
      zIndex: 10,
      editable: true,
      page: 1
    })

    // Logo - ajusté pour remplir toute la zone à droite sans espace blanc
    newItems.push({
      id: 'cover-logo',
      type: 'logo',
      content: 'logo',
      position: { x: 600, y: 35 }, // Position X ajustée pour étendre jusqu'au bord
      size: { width: 190, height: 120 }, // Largeur augmentée pour remplir tout l'espace à droite
      zIndex: 15,
      page: 1
    })

    // Image principale de la propriété (agrandie x2)
    newItems.push({
      id: 'cover-property-image',
      type: 'image',
      content: '',
      position: { x: 150, y: 170 }, // Ajusté pour accommoder le titre descendu
      size: { width: 500, height: 350 }, // Taille doublée (de 400x280 à 500x350)
      zIndex: 5,
      imageUrl: mainImageUrl,
      page: 1
    })

    // Encadré d'informations de la propriété - agrandi
    newItems.push({
      id: 'cover-info-box',
      type: 'text',
      content: 'PROPERTY INFORMATION',
      position: { x: 150, y: 530 }, // Position ajustée après l'image agrandie
      size: { width: 500, height: 50 }, // Taille augmentée
      zIndex: 15,
      editable: true,
      page: 1,
      isHeader: true
    })

    // Informations de référence - agrandi
    newItems.push({
      id: 'cover-reference-number',
      type: 'property-field',
      content: {
        label: 'Reference Number',
        value: property?.reference || 'N/A'
      },
      position: { x: 150, y: 590 }, // Position ajustée
      size: { width: 500, height: 40 }, // Taille augmentée
      zIndex: 5,
      page: 1
    })

    // Adresse de la propriété - agrandi
    newItems.push({
      id: 'cover-property-address',
      type: 'property-field',
      content: {
        label: 'Property Address',
        value: property?.address || 'Not specified'
      },
      position: { x: 150, y: 640 }, // Position ajustée
      size: { width: 500, height: 40 }, // Taille augmentée
      zIndex: 5,
      page: 1
    })

    // Date et informations sur l'inventaire - agrandi
    newItems.push({
      id: 'cover-inventory-info',
      type: 'property-info',
      content: {
        date: currentDate,
    listingPerson: property?.listingPerson || 'Not specified',
    owners: property?.owner ? property.owner.name : 'Not specified'
      },
      position: { x: 150, y: 690 }, // Position ajustée
      size: { width: 500, height: 160 }, // Taille augmentée
      zIndex: 5,
      page: 1
    })

    // Section résumé (titre) - agrandi
    newItems.push({
      id: 'cover-summary-title',
      type: 'text',
      content: 'INVENTORY SUMMARY',
      position: { x: 50, y: 860 }, // Position ajustée après les informations agrandies
      size: { width: 700, height: 50 }, // Taille augmentée
      zIndex: 10,
      editable: true,
      page: 1,
      isHeader: true
    })

    // Statistiques globales - agrandi
    newItems.push({
      id: 'cover-summary-stats',
      type: 'text',
      content: `This inventory contains ${totalRooms} rooms with a total of ${totalImages} images documenting all items in the property. Each room has been carefully cataloged with detailed images of all included furniture and fixtures.`,
      position: { x: 50, y: 920 }, // Position ajustée
      size: { width: 700, height: 80 }, // Taille augmentée
      zIndex: 5,
      editable: true,
      page: 1
    })

    // Disclaimer (position maintenue car en bas de page)
    newItems.push({
      id: 'cover-disclaimer',
      type: 'disclaimer',
      content:
        'Disclaimer: Inventory items are in used condition. Exclusive Living Mediaçao Imobiliaria does not hold any responsibility for the condition the articles sold and their condition at the time of deeds.',
      position: { x: 50, y: 1030 },
      size: { width: 700, height: 40 },
      zIndex: 5,
      page: 1
    })

    // ---- CRÉATION DES PAGES D'INVENTAIRE DÉTAILLÉ (À PARTIR DE LA PAGE 2) ----

    // Le reste du code reste identique...

    // Commencer à la page 2
    let currentPage = 2
    const pageStartY = 100
    const pageEndY = 1000

    // Ajouter en-tête sur chaque page
    newItems.push({
      id: `header-page-${currentPage}`,
      type: 'text',
      content: 'Inventário em estado de usado',
      position: { x: 0, y: 0 },
      size: { width: 800, height: 25 },
      zIndex: 20,
      page: currentPage,
      editable: true,
      isHeader: true
    })

    // Ajouter le logo (plus petit) sur les pages suivantes
    newItems.push({
      id: `logo-page-${currentPage}`,
      type: 'logo',
      content: 'logo',
      position: { x: 680, y: 30 },
      size: { width: 100, height: 50 },
      zIndex: 15,
      page: currentPage
    })

    // Titre de la section d'inventaire
    newItems.push({
      id: `inventory-title-${currentPage}`,
      type: 'heading',
      content: 'DETAILED INVENTORY',
      position: { x: 300, y: 50 },
      size: { width: 400, height: 50 },
      zIndex: 10,
      editable: true,
      page: currentPage
    })

    // Ajouter un disclaimer sur chaque page
    newItems.push({
      id: `disclaimer-page-${currentPage}`,
      type: 'disclaimer',
      content:
        'Disclaimer: Inventory items are in used condition. Exclusive Living Mediaçao Imobiliaria does not hold any responsibility for the condition the articles sold and their condition at the time of deeds.',
      position: { x: 50, y: 1030 },
      size: { width: 700, height: 40 },
      zIndex: 5,
      page: currentPage
    })

    // Définir la position Y initiale après les titres
    let currentY = pageStartY + 60

    // Parcourir chaque pièce
    rooms.forEach((room, roomIndex) => {
      // Si on n'a pas assez de place pour la pièce complète, passer à la page suivante
      if (currentY + 150 > pageEndY) {
        currentPage++
        currentY = pageStartY

        // Ajouter en-tête pour la nouvelle page
        newItems.push({
          id: `header-page-${currentPage}`,
          type: 'text',
          content: 'Inventário em estado de usado',
          position: { x: 0, y: 0 },
          size: { width: 800, height: 25 },
          zIndex: 20,
          page: currentPage,
          editable: true,
          isHeader: true
        })

        // Ajouter le logo (plus petit) sur la nouvelle page
        newItems.push({
          id: `logo-page-${currentPage}`,
          type: 'logo',
          content: 'logo',
          position: { x: 680, y: 30 },
          size: { width: 100, height: 50 },
          zIndex: 15,
          page: currentPage
        })

        // Ajouter un disclaimer pour la nouvelle page
        newItems.push({
          id: `disclaimer-page-${currentPage}`,
          type: 'disclaimer',
          content:
            'Disclaimer: Inventory items are in used condition. Exclusive Living Mediaçao Imobiliaria does not hold any responsibility for the condition the articles sold and their condition at the time of deeds.',
          position: { x: 50, y: 1030 },
          size: { width: 700, height: 40 },
          zIndex: 5,
          page: currentPage
        })
      }

      // Ajouter titre de la pièce (en-tête de pièce)
      newItems.push({
        id: `room-title-${room.id}`,
        type: 'room',
        content: room.name,
        position: { x: 0, y: currentY },
        size: { width: 800, height: 70 },
        zIndex: 5,
        roomId: room.id,
        page: currentPage,
        isRoomHeader: true
      })

      currentY += 80

      // Obtenir les images pour cette pièce
      const roomImgs = roomImages[room.id] || []

      // Ajouter une introduction/résumé pour la pièce
      if (roomImgs.length > 0) {
        newItems.push({
          id: `room-intro-${room.id}`,
          type: 'text',
          content: `This room contains ${roomImgs.length} cataloged images. All images are sold as shown and in their current condition.`,
          position: { x: 50, y: currentY },
          size: { width: 700, height: 40 },
          zIndex: 5,
          editable: true,
          page: currentPage
        })

        currentY += 60

        // Traiter chaque image de la pièce
        roomImgs.forEach((img, imgIndex) => {
          // Vérifier s'il faut passer à une nouvelle page
          if (currentY + 410 > pageEndY) {
            currentPage++
            currentY = pageStartY / 2

            // Ajouter en-tête pour la nouvelle page
            newItems.push({
              id: `header-page-${currentPage}`,
              type: 'text',
              content: 'Inventário em estado de usado',
              position: { x: 0, y: 0 },
              size: { width: 800, height: 25 },
              zIndex: 20,
              page: currentPage,
              editable: true,
              isHeader: true
            })

            // Ajouter le logo (plus petit) sur la nouvelle page
            newItems.push({
              id: `logo-page-${currentPage}`,
              type: 'logo',
              content: 'logo',
              position: { x: 680, y: 30 },
              size: { width: 100, height: 50 },
              zIndex: 15,
              page: currentPage
            })

            // Ajouter un en-tête de pièce pour rappel sur la nouvelle page
            newItems.push({
              id: `room-header-${room.id}-${imgIndex}`,
              type: 'text',
              content: `${room.name} (continued)`,
              position: { x: 300, y: currentY },
              size: { width: 800, height: 30 },
              zIndex: 5,
              page: currentPage,
              editable: true,
              isRoomHeader: true
            })

            currentY += 50

            // Ajouter un disclaimer pour la nouvelle page
            newItems.push({
              id: `disclaimer-page-${currentPage}`,
              type: 'disclaimer',
              content:
                'Disclaimer: Inventory items are in used condition. Exclusive Living Mediaçao Imobiliaria does not hold any responsibility for the condition the articles sold and their condition at the time of deeds.',
              position: { x: 50, y: 1030 },
              size: { width: 700, height: 40 },
              zIndex: 5,
              page: currentPage
            })
          }

          // Ajouter l'image avec une numérotation claire
          newItems.push({
            id: `room-image-${room.id}-${imgIndex}`,
            type: 'image',
            content: `${room.name} - Image ${imgIndex + 1}/${roomImgs.length}`,
            position: { x: 0, y: currentY },
            size: { width: 550, height: 390 },
            zIndex: 5,
            imageUrl: img.url,
            page: currentPage,
            description: `${room.name} - Image ${imgIndex + 1}/${
              roomImgs.length
            }`
          })

          // Ajouter une description à droite de l'image (plus détaillée)
          const defaultDesc =
            img.description ||
            `This image shows essential items in the ${room.name}. All furniture and fixtures shown are included in the inventory and are sold in their current condition. The buyer accepts the items as shown in this photograph.`

          newItems.push({
            id: `room-desc-${room.id}-${imgIndex}`,
            type: 'text',
            content: defaultDesc,
            position: { x: 560, y: currentY + 50 },
            size: { width: 220, height: 240 },
            zIndex: 5,
            editable: true,
            page: currentPage
          })

          // Ajouter un numéro pour cette image
          newItems.push({
            id: `page-number-${room.id}-${imgIndex}`,
            type: 'text',
            content: ``,
            position: { x: 560, y: currentY + 20 },
            size: { width: 220, height: 30 },
            zIndex: 5,
            editable: true,
            page: currentPage
          })

          // Augmenter la position Y pour la prochaine image
          currentY += 410 + 30
        })
      } else {
        // Message pour les pièces sans images
        newItems.push({
          id: `room-no-images-${room.id}`,
          type: 'text',
          content: `No images available for ${room.name}.`,
          position: { x: 300, y: currentY },
          size: { width: 700, height: 40 },
          zIndex: 5,
          editable: true,
          page: currentPage
        })

        currentY += 50
      }

      // Ajouter un espacement entre les pièces
      currentY += 60
    })

    // Ajouter tous les nouveaux éléments au canvas
    setCanvasItems(prev => [...prev, ...newItems])

    // Mettre à jour le nombre total de pages
    setTotalPages(Math.max(currentPage, totalPages))

    // S'assurer que la première page est active pour voir les résultats
    setCurrentPage(1)
  }
  const getItemsForCurrentPage = () => {
    return canvasItems.filter(item => {
      // Éléments explicitement associés à la page courante
      if (item.page === currentPage) {
        return true
      }

      // Éléments standards de la page 1 (si on est sur la page 1)
      if (currentPage === 1) {
        if (
          item.id === 'title' ||
          item.id === 'property-image' ||
          item.id === 'reference-number' ||
          item.id === 'property-address' ||
          item.id === 'inventory-info-group' ||
          item.id === 'disclaimer' ||
          item.id.startsWith('cover-')
        ) {
          return true
        }
      }

      // Disclaimer pour les pages > 1
      if (currentPage > 1 && item.id === 'disclaimer') {
        return true
      }

      // Éléments ajoutés manuellement sans page spécifiée et qui ne sont pas des éléments générés
      if (
        item.page === undefined &&
        !item.id.includes('room-') &&
        !item.id.includes('attractive-title-') &&
        !item.id.includes('disclaimer-page-') &&
        !item.id.includes('cover-') &&
        !item.id.includes('page-number-') &&
        !item.id.includes('summary-') &&
        item.id !== 'title' &&
        item.id !== 'property-image' &&
        item.id !== 'reference-number' &&
        item.id !== 'property-address' &&
        item.id !== 'inventory-info-group'
      ) {
        return true
      }

      return false
    })
  }

  const toggleSection = (section: SectionKey) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleDrag = (e: React.MouseEvent) => {
    if (!activeDrag || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()

    const newX = e.clientX - canvasRect.left - dragOffset.x
    const newY = e.clientY - canvasRect.top - dragOffset.y

    setCanvasItems(prev =>
      prev.map(item =>
        item.id === activeDrag
          ? {
              ...item,
              position: { x: Math.max(0, newX), y: Math.max(0, newY) }
            }
          : item
      )
    )
  }

  const handleDragEnd = () => {
    setActiveDrag(null)
  }

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const item = canvasItems.find(item => item.id === id)
    if (!item) return

    setResizingItem(id)
    setResizeStart({ x: e.clientX, y: e.clientY })
    setInitialSize({ width: item.size.width, height: item.size.height })
  }

  const handleResize = (e: React.MouseEvent) => {
    if (!resizingItem || !canvasRef.current) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    setCanvasItems(prev =>
      prev.map(item =>
        item.id === resizingItem
          ? {
              ...item,
              size: {
                width: Math.max(50, initialSize.width + deltaX),
                height: Math.max(50, initialSize.height + deltaY)
              }
            }
          : item
      )
    )
  }

  const repositionDisclaimerOnResize = () => {
    setCanvasItems(prev =>
      prev.map(item =>
        item.type === 'disclaimer'
          ? {
              ...item,
              position: { x: 50, y: 1030 },
              size: { width: 700, height: 40 }
            }
          : item
      )
    )
  }

  const renderPropertyField = (item: { content: any; id: any }) => {
    if (item.content.label === 'Reference Number') {
      return (
        <div className='relative h-full group'>
          <div className='text-black'>
            {editingText === item.id ? (
              <div>
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => {
                    setCanvasItems(prev =>
                      prev.map(prevItem =>
                        prevItem.id === item.id
                          ? {
                              ...prevItem,
                              content: {
                                ...prevItem.content,
                                value: editText
                              }
                            }
                          : prevItem
                      )
                    )
                    setEditingText(null)
                  }}
                  className='w-full border border-[#D4A017] px-1 py-1 bg-white font-bold text-lg'
                  autoFocus
                />
              </div>
            ) : (
              <div className='font-bold text-lg'>{item.content.value}</div>
            )}
          </div>
          {renderControlButtons(item)}
        </div>
      )
    }

    return (
      <div className='relative h-full group'>
        <div className='text-black'>
          {editingText === item.id ? (
            <div>
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onBlur={() => {
                  setCanvasItems(prev =>
                    prev.map(prevItem =>
                      prevItem.id === item.id
                        ? {
                            ...prevItem,
                            content: {
                              ...prevItem.content,
                              value: editText
                            }
                          }
                        : prevItem
                    )
                  )
                  setEditingText(null)
                }}
                className='w-full border border-[#D4A017] px-1 py-1 bg-white'
                autoFocus
              />
            </div>
          ) : (
            <div>{item.content.value}</div>
          )}
        </div>
        {renderControlButtons(item)}
      </div>
    )
  }

  const renderControlButtons = (item: ControlButtonsProps) => {
    return (
      <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex'>
        <button
          onClick={e => {
            e.stopPropagation()
            setEditingText(item.id)
            setEditText(item.content.value)
          }}
          className='p-1 bg-[#D4A017] text-white rounded-tl-md'
        >
          <svg
            xmlns='http:www.w3.org/2000/svg'
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
            deleteItem(item.id)
          }}
          className='p-1 bg-red-600 text-white rounded-tr-md'
        >
          <svg
            xmlns='http:www.w3.org/2000/svg'
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
    )
  }

  const handleResizeEnd = () => {
    setResizingItem(null)
  }

  const addItemToCanvas = (
    type: DraggableItem['type'],
    content: any,
    size: { width: number; height: number },
    roomId?: string,
    imageUrl?: string,
    description?: string
  ) => {
    const newItem: DraggableItem = {
      id: `${type}-${Date.now()}`,
      type,
      content,
      position: { x: 100, y: 100 },
      size,
      zIndex: Math.max(0, ...canvasItems.map(item => item.zIndex)) + 1,
      editable: type === 'text' || type === 'heading',
      roomId,
      imageUrl,
      description
    }

    setCanvasItems(prev => [...prev, newItem])
  }

  const deleteItem = (id: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== id))
  }

  const startEditingText = (id: string) => {
    const item = canvasItems.find(item => item.id === id)
    if (!item) return

    setEditingText(id)
    setEditText(item.content)
  }

  const saveEditedText = () => {
    if (!editingText) return

    setCanvasItems(prev =>
      prev.map(item =>
        item.id === editingText ? { ...item, content: editText } : item
      )
    )

    setEditingText(null)
    setEditText('')
  }

  // Fonction d'exportation PDF complètement revue
  const generatePDF = async () => {
    // Sauvegarder la page actuelle
    const currentPageBackup = currentPage

    // Créer un conteneur d'impression visible
    const printContainer = document.createElement('div')
    printContainer.id = 'print-container'
    printContainer.style.position = 'fixed'
    printContainer.style.top = '0'
    printContainer.style.left = '0'
    printContainer.style.width = '100%'
    printContainer.style.height = '100%'
    printContainer.style.zIndex = '9999'
    printContainer.style.backgroundColor = 'white'
    printContainer.style.overflow = 'auto'
    document.body.appendChild(printContainer)

    // Ajouter un message de chargement
    const loadingMessage = document.createElement('div')
    loadingMessage.style.position = 'fixed'
    loadingMessage.style.top = '50%'
    loadingMessage.style.left = '50%'
    loadingMessage.style.transform = 'translate(-50%, -50%)'
    loadingMessage.style.padding = '20px'
    loadingMessage.style.background = 'rgba(0,0,0,0.7)'
    loadingMessage.style.color = 'white'
    loadingMessage.style.borderRadius = '10px'
    loadingMessage.style.fontSize = '18px'
    loadingMessage.style.zIndex = '10000'
    loadingMessage.innerText = 'Préparation du PDF...'
    document.body.appendChild(loadingMessage)

    try {
      // Fonction qui rend une page et renvoie son HTML
      const renderPage = async (
        pageNum: number
      ): Promise<HTMLElement | null> => {
        return new Promise(resolve => {
          // Passer à la page à capturer
          setCurrentPage(pageNum)

          // Attendre le rendu complet
          setTimeout(() => {
            if (canvasRef.current) {
              // Créer une copie du contenu
              const pageClone = canvasRef.current.cloneNode(true) as HTMLElement

              // Supprimer les contrôles d'édition
              pageClone
                .querySelectorAll(
                  '.opacity-0, button, .group-hover\\:opacity-100'
                )
                .forEach(el => {
                  if (el.parentNode) {
                    el.parentNode.removeChild(el)
                  }
                })

              // Appliquer les styles spécifiques pour l'impression
              pageClone
                .querySelectorAll('[data-is-header="true"]')
                .forEach(el => {
                  el.classList.add('header-inventario')
                })

              // Appliquer le style aux en-têtes de pièce
              pageClone
                .querySelectorAll('[data-is-room-header="true"]')
                .forEach(el => {
                  el.setAttribute(
                    'style',
                    'background-color: white !important; color: black !important; border-top: 2px solid #F0CA44 !important; border-bottom: 2px solid #F0CA44 !important; text-align: center !important; padding: 12px !important; width: 100% !important; font-size: 18px !important; font-weight: bold !important;'
                  )
                })

              resolve(pageClone)
            } else {
              resolve(null)
            }
          }, 300) // Délai suffisant pour le rendu
        })
      }

      // Préparer toutes les pages séquentiellement et les ajouter au conteneur
      for (let i = 1; i <= totalPages; i++) {
        const pageContent = await renderPage(i)

        if (pageContent) {
          const pageWrapper = document.createElement('div')
          pageWrapper.style.width = '800px'
          pageWrapper.style.height = '1100px'
          pageWrapper.style.margin = '0 auto 20px auto'
          pageWrapper.style.position = 'relative'
          pageWrapper.style.pageBreakAfter = 'always'
          pageWrapper.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)'
          pageWrapper.style.backgroundColor = 'white'

          // Ajouter un numéro de page
          const pageNumber = document.createElement('div')
          pageNumber.style.position = 'absolute'
          pageNumber.style.bottom = '10px'
          pageNumber.style.right = '10px'
          pageNumber.style.fontSize = '12px'
          pageNumber.style.color = '#666'
          pageNumber.innerText = `Page ${i} / ${totalPages}`

          pageWrapper.appendChild(pageContent)
          pageWrapper.appendChild(pageNumber)
          printContainer.appendChild(pageWrapper)

          // Mettre à jour le message de chargement
          loadingMessage.innerText = `Préparation du PDF... (${i}/${totalPages})`
        }
      }

      // Supprimer le message de chargement
      document.body.removeChild(loadingMessage)

      // Ajouter les styles d'impression
      const printStyle = document.createElement('style')
      printStyle.id = 'print-style'
      printStyle.textContent = `
      @media print {
  body * {
    visibility: hidden;
  }
  #print-container, #print-container * {
    visibility: visible;
  }
  #print-container {
    position: absolute !important;
    left: 0;
    top: 0;
    overflow: visible !important;
    height: auto !important;
  }
  @page {
    size: A4 portrait;
    margin: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .page-break {
    page-break-after: always;
    height: 0;
    margin: 0;
  }

  /* Styles spécifiques pour l'impression */
  .header-inventario {
    background-color: #B8A150 !important;
    color: white !important;
    width: 100% !important;
    text-align: center !important;
    padding: 8px 0 !important;
    font-weight: 500 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  [data-is-room-header="true"] {
    padding: 12px !important;
    background-color: white !important;
    color: black !important;
    font-weight: bold !important;
    font-size: 18px !important;
    text-align: center !important;
    border-top: 2px solid #F0CA44 !important;
    border-bottom: 2px solid #F0CA44 !important;
    width: 100% !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  /* Ensures all background-colors and colors print properly */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
 
}
    `
      document.head.appendChild(printStyle)

      // Lancer l'impression avec un léger délai pour s'assurer que tout est chargé
      setTimeout(() => {
        window.print()

        // Nettoyer après l'impression
        setTimeout(() => {
          document.body.removeChild(printContainer)
          document.head.removeChild(printStyle)
          setCurrentPage(currentPageBackup)
        }, 1000)
      }, 500)
    } catch (error) {
      // En cas d'erreur, nettoyer et revenir à l'état initial
      if (document.body.contains(loadingMessage)) {
        document.body.removeChild(loadingMessage)
      }

      // Créer un message d'erreur
      const errorMessage = document.createElement('div')
      errorMessage.style.position = 'fixed'
      errorMessage.style.top = '50%'
      errorMessage.style.left = '50%'
      errorMessage.style.transform = 'translate(-50%, -50%)'
      errorMessage.style.padding = '20px'
      errorMessage.style.background = 'rgba(220,53,69,0.9)'
      errorMessage.style.color = 'white'
      errorMessage.style.borderRadius = '10px'
      errorMessage.style.fontSize = '18px'
      errorMessage.style.zIndex = '10000'
      errorMessage.innerText =
        'Erreur lors de la création du PDF. Veuillez réessayer.'
      document.body.appendChild(errorMessage)

      // Supprimer le message d'erreur après quelques secondes
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage)
        }

        // Revenir à la page d'origine
        setCurrentPage(currentPageBackup)
      }, 3000)
    }
  }

  const addNewPage = () => {
    setTotalPages(prev => prev + 1)
    setCurrentPage(prev => prev + 1)
  }

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const getPropertyMainImage = () => {
    if (property?.image) {
      return property.image
    }

    for (const roomId in roomImages) {
      const images = roomImages[roomId]
      if (images && images.length > 0) {
        return images[0].url
      }
    }

    return '/images/property-placeholder.jpg'
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-[#D4A017]'>
          <svg
            className='animate-spin h-10 w-10'
            xmlns='http:www.w3.org/2000/svg'
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

  return (
    <div className='flex h-screen bg-[#1E1E1E]'>
      {/* Left sidebar - Elements */}
      <div className='w-80 border-r border-[#2D2D2D] p-4 overflow-y-auto bg-[#2D2D2D]'>
        <div className='mb-2 flex justify-between items-center'>
          <h2 className='text-[#FFFFFF] font-bold'>Elements</h2>
          <Link
            href={`/properties/${id}`}
            className='text-[#D4A017] text-sm hover:underline'
          >
            Back
          </Link>
        </div>

        {/* Basic elements */}
        <div className='mb-4'>
          <div
            onClick={() => toggleSection('basic')}
            className='flex justify-between items-center cursor-pointer text-[#D4A017] text-xs uppercase tracking-wider mb-2 p-1 hover:bg-[#3D3D3D] rounded'
          >
            <h3>Basic</h3>
            <svg
              xmlns='http:www.w3.org/2000/svg'
              className={`h-4 w-4 transition-transform ${
                sectionsOpen.basic ? 'transform rotate-180' : ''
              }`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>

          {sectionsOpen.basic && (
            <div className='grid grid-cols-2 gap-2'>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas('text', 'Click to edit this text', {
                    width: 300,
                    height: 50
                  })
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
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
                  Text Block
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas('heading', 'Heading', {
                    width: 400,
                    height: 60
                  })
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 6h16M4 12h16M4 18h7'
                    />
                  </svg>
                  Heading
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas('logo', 'logo', { width: 120, height: 60 })
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                    />
                  </svg>
                  Logo
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas(
                    'disclaimer',
                    'Disclaimer: Inventory items are in used condition. Exclusive Living Mediaçao Imobiliaria does not hold any responsibility for the condition the articles sold and their condition at the time of deeds.',
                    { width: 700, height: 40 }
                  )
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  Disclaimer
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Property Information */}
        <div className='mb-4'>
          <div
            onClick={() => toggleSection('propertyInfo')}
            className='flex justify-between items-center cursor-pointer text-[#D4A017] text-xs uppercase tracking-wider mb-2 p-1 hover:bg-[#3D3D3D] rounded'
          >
            <h3>Property Information</h3>
            <svg
              xmlns='http:www.w3.org/2000/svg'
              className={`h-4 w-4 transition-transform ${
                sectionsOpen.propertyInfo ? 'transform rotate-180' : ''
              }`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>

          {sectionsOpen.propertyInfo && (
            <div className='grid grid-cols-2 gap-2'>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas(
                    'property-field',
                    {
                      label: 'Reference Number',
                      value: property?.reference || 'N/A'
                    },
                    { width: 300, height: 25 }
                  )
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                    />
                  </svg>
                  Reference Number
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas(
                    'property-field',
                    {
                      label: 'Property Address',
                      value: property?.address || 'Not specified'
                    },
                    { width: 300, height: 25 }
                  )
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                    />
                  </svg>
                  Property Address
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas(
                    'property-field',
                    {
                      label: 'Date of Inventory',
                      value: new Date().toLocaleDateString()
                    },
                    { width: 300, height: 25 }
                  )
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                  Date of Inventory
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas(
                    'property-field',
                    { label: 'Name Listing Person', value: 'Not specified' },
                    { width: 300, height: 25 }
                  )
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                  Name Listing Person
                </div>
              </div>
              <div
                className='bg-[#1E1E1E] p-2 rounded cursor-pointer hover:bg-[#333333]'
                onClick={() =>
                  addItemToCanvas(
                    'property-field',
                    { label: 'Owner Inventory List', value: 'Not specified' },
                    { width: 300, height: 25 }
                  )
                }
              >
                <div className='flex items-center text-[#FFFFFF]'>
                  <svg
                    xmlns='http:www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2 text-[#D4A017]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                  Owner Inventory List
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Canvas and toolbar */}
      <div className='flex-1 flex flex-col'>
        {/* Toolbar */}
        <div className='bg-[#2D2D2D] px-4 py-2 flex justify-between items-center'>
          <div className='flex items-center space-x-4'>
            <div className='text-[#FFFFFF]'>
              Page {currentPage} of {totalPages}
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1 rounded ${
                  currentPage === 1
                    ? 'text-[#5D5D5D]'
                    : 'text-[#D4A017] hover:bg-[#333333]'
                }`}
              >
                <svg
                  xmlns='http:www.w3.org/2000/svg'
                  className='h-5 w-5'
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
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded ${
                  currentPage === totalPages
                    ? 'text-[#5D5D5D]'
                    : 'text-[#D4A017] hover:bg-[#333333]'
                }`}
              >
                <svg
                  xmlns='http:www.w3.org/2000/svg'
                  className='h-5 w-5'
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
            <button
              onClick={addNewPage}
              className='flex items-center text-[#D4A017] hover:underline'
            >
              <svg
                xmlns='http:www.w3.org/2000/svg'
                className='h-4 w-4 mr-1'
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
              Add Page
            </button>
          </div>

          <button
            onClick={addRoomSectionsToCanvas}
            className='bg-[#D4A017] text-[#1E1E1E] px-4 py-1.5 rounded hover:bg-[#E6B52C] font-medium flex items-center mr-4'
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
                d='M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
              />
            </svg>
            Auto-Generate Rooms
          </button>

          <div>
            <button
              onClick={generatePDF}
              className='bg-[#D4A017] text-[#1E1E1E] px-4 py-1.5 rounded hover:bg-[#E6B52C] font-medium flex items-center'
            >
              <svg
                xmlns='http:www.w3.org/2000/svg'
                className='h-5 w-5 mr-1'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className='flex-1 p-4 overflow-auto flex justify-center'
          onMouseMove={e => {
            if (activeDrag) {
              handleDrag(e)
            }
            if (resizingItem) {
              handleResize(e)
            }
          }}
          onMouseUp={() => {
            handleDragEnd()
            handleResizeEnd()
          }}
        >
          <div
            ref={canvasRef}
            id='pdf-content'
            className='w-[800px] h-[1100px] bg-white shadow-lg relative'
          >
            {/* Render all canvas items */}
            {getItemsForCurrentPage().map(item => (
              <div
                key={item.id}
                className={`absolute ${
                  activeDrag === item.id ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  left: `${item.position.x}px`,
                  top: `${item.position.y}px`,
                  width: `${item.size.width}px`,
                  height: `${item.size.height}px`,
                  zIndex: item.zIndex
                }}
                onMouseDown={e => handleDragStart(e, item.id)}
              >
                {/* Different rendering based on item type */}
                {item.type === 'text' && (
                  <div className='relative h-full group'>
                    {item.isHeader ? (
                      // Style pour l'en-tête "Inventário em estado de usado"
                      <div
                        className='w-full text-center p-2 bg-[#B8A150] text-white font-medium'
                        style={{ backgroundColor: '#B8A150', color: 'white' }} // Ajout de styles inline pour l'impression
                        data-is-header='true'
                      >
                        {editingText === item.id ? (
                          <input
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onBlur={() => {
                              setCanvasItems(prev =>
                                prev.map(prevItem =>
                                  prevItem.id === item.id
                                    ? { ...prevItem, content: editText }
                                    : prevItem
                                )
                              )
                              setEditingText(null)
                            }}
                            className='w-full text-center bg-[#B8A150] text-white p-1 border border-white'
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={e => {
                              e.stopPropagation()
                              startEditingText(item.id)
                              setEditText(item.content)
                            }}
                          >
                            {item.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {editingText === item.id ? (
                          <div className='absolute inset-0'>
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onBlur={saveEditedText}
                              className='w-full h-full p-2 border border-[#D4A017] resize-none bg-white text-black'
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <div className='p-2 text-black'>{item.content}</div>
                            {item.editable && (
                              <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex'>
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    startEditingText(item.id)
                                  }}
                                  className='p-1 bg-[#D4A017] text-white rounded-tl-md'
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
                                    deleteItem(item.id)
                                  }}
                                  className='p-1 bg-red-600 text-white rounded-tr-md'
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
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
                {item.type === 'heading' && (
                  <div className='relative h-full group'>
                    {editingText === item.id ? (
                      <div className='absolute inset-0'>
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={saveEditedText}
                          className='w-full h-full p-2 border border-[#D4A017] resize-none bg-white text-black'
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        {/* Style amélioré pour le titre principal */}
                        {item.content === 'PROPERTY INVENTORY' ? (
                          <div className='flex flex-col items-center justify-center h-full'>
                            <div className='text-black text-4xl font-bold text-center'>
                              {item.content}
                            </div>
                            <div className='h-2 w-48 bg-[#D4A017] mt-3'></div>
                          </div>
                        ) : item.content === 'Explore Every Room in Detail' ? (
                          <div className='p-2 text-black text-2xl font-bold text-center'>
                            {item.content}
                            <div className='h-1 w-32 bg-[#D4A017] mt-2 mx-auto'></div>
                          </div>
                        ) : (
                          <div className='p-2 text-black text-xl font-bold'>
                            {item.content}
                          </div>
                        )}

                        {item.editable && (
                          <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex'>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                startEditingText(item.id)
                              }}
                              className='p-1 bg-[#D4A017] text-white rounded-tl-md'
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
                                deleteItem(item.id)
                              }}
                              className='p-1 bg-red-600 text-white rounded-tr-md'
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
                        )}
                      </>
                    )}
                  </div>
                )}
                {item.type === 'image' && (
                  <div className='relative h-full group'>
                    <div className='w-full h-full flex flex-col'>
                      <div className='flex-1 relative'>
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.content}
                            fill
                            className='object-cover w-full h-full' // Changé de 'object-contain' à 'object-cover'
                            style={{ objectPosition: 'left' }} // Aligné à gauche
                          />
                        )}

                        {/* Option pour agrandir spécifiquement l'image de propriété */}
                        {item.id === 'property-image' && (
                          <div
                            className='absolute top-0 left-0 m-1 p-1 bg-[#D4A017]/80 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer'
                            onClick={e => {
                              e.stopPropagation()

                              setCanvasItems(prev =>
                                prev.map(prevItem =>
                                  prevItem.id === item.id
                                    ? {
                                        ...prevItem,
                                        size: {
                                          width: prevItem.size.width * 1.2,
                                          height: prevItem.size.height * 1.2
                                        }
                                      }
                                    : prevItem
                                )
                              )
                            }}
                          >
                            <svg
                              xmlns='http:www.w3.org/2000/svg'
                              className='h-4 w-4 text-white'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {editingText === item.id ? (
                        <div className='mt-1 absolute bottom-0 left-0 right-0'>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onBlur={saveEditedText}
                            className='w-full p-1 border border-[#D4A017] resize-none bg-white text-black text-xs'
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className='mt-1 text-xs text-center text-black'>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex'>
                      {/* Boutons de contrôle... */}
                    </div>

                    {/* Resize handle */}
                    <div
                      className='absolute bottom-0 right-0 w-5 h-5 bg-[#D4A017] opacity-0 group-hover:opacity-100 cursor-se-resize'
                      onMouseDown={e => {
                        e.stopPropagation()
                        handleResizeStart(e, item.id)
                      }}
                    >
                      {/* Icône resize... */}
                    </div>
                  </div>
                )}

                {item.type === 'room' && (
                  <div className='relative h-full group'>
                    {item.isRoomHeader ? (
                      // Style amélioré pour les en-têtes de pièce
                      <div
                        className='p-3 text-black font-bold text-center border-t border-b border-[#F0CA44] w-full text-xl'
                        style={{
                          backgroundColor: 'white',
                          color: 'black',
                          borderTop: '2px solid #F0CA44',
                          borderBottom: '2px solid #F0CA44',
                          fontFamily: 'Arial, sans-serif'
                        }}
                        data-is-room-header='true'
                      >
                        {editingText === item.id ? (
                          <input
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onBlur={() => {
                              setCanvasItems(prev =>
                                prev.map(prevItem =>
                                  prevItem.id === item.id
                                    ? { ...prevItem, content: editText }
                                    : prevItem
                                )
                              )
                              setEditingText(null)
                            }}
                            className='w-full text-center bg-white text-black p-1 border border-[#B8A150] text-xl font-bold'
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={e => {
                              e.stopPropagation()
                              startEditingText(item.id)
                              setEditText(item.content)
                            }}
                          >
                            {item.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Style standard pour les autres éléments de type 'room'
                      <div className='p-2 bg-[#D4A017]/20 border border-[#D4A017] text-black font-medium rounded'>
                        {item.content}
                      </div>
                    )}
                    <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100'>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem(item.id)
                        }}
                        className='p-1 bg-red-600 text-white rounded-tr-md'
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
                )}

                {item.type === 'property-field' &&
  item.content.label === 'Reference Number' && (
    <div className='relative h-full group'>
      <div className='flex flex-col items-center justify-center'> {/* Ajout de 'items-center' pour centrer */}
        <div className='text-black font-bold text-lg text-center'> {/* Ajout de 'text-center' */}
          {editingText === item.id ? (
            <input
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={() => {
                setCanvasItems(prev =>
                  prev.map(prevItem =>
                    prevItem.id === item.id
                      ? {
                          ...prevItem,
                          content: {
                            ...prevItem.content,
                            value: editText
                          }
                        }
                      : prevItem
                  )
                )
                setEditingText(null)
              }}
              className='w-full border border-[#D4A017] px-2 py-1 bg-white font-bold text-lg text-center'
              autoFocus
            />
          ) : (
            <div>{item.content.value}</div>
          )}
        </div>
      </div>
      {renderControlButtons(item)}
    </div>
  )}

                {item.type === 'property-field' &&
  item.content.label === 'Property Address' && (
    <div className='relative h-full group'>
      <div className='flex items-center justify-center'> {/* Ajout de 'justify-center' pour centrer */}
        <div className='text-black text-center'> {/* Ajout de 'text-center' */}
          {editingText === item.id ? (
            <input
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={() => {
                setCanvasItems(prev =>
                  prev.map(prevItem =>
                    prevItem.id === item.id
                      ? {
                          ...prevItem,
                          content: {
                            ...prevItem.content,
                            value: editText
                          }
                        }
                      : prevItem
                  )
                )
                setEditingText(null)
              }}
              className='border border-[#D4A017] px-2 py-1 bg-white w-full text-center'
              autoFocus
            />
          ) : (
            <div>{item.content.value}</div>
          )}
        </div>
      </div>
      {renderControlButtons(item)}
    </div>
  )}

                {item.type === 'property-field' &&
                  item.content.label !== 'Reference Number' &&
                  item.content.label !== 'Property Address' && (
                    <div className='relative h-full group'>
                      <div className='flex flex-col'>
                        <div className='text-gray-500 text-xs mb-1'>
                          {item.content.label}:
                        </div>
                        <div className='text-black'>
                          {editingText === item.id ? (
                            <input
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onBlur={() => {
                                setCanvasItems(prev =>
                                  prev.map(prevItem =>
                                    prevItem.id === item.id
                                      ? {
                                          ...prevItem,
                                          content: {
                                            ...prevItem.content,
                                            value: editText
                                          }
                                        }
                                      : prevItem
                                  )
                                )
                                setEditingText(null)
                              }}
                              className='w-full border border-[#D4A017] px-2 py-1 bg-white'
                              autoFocus
                            />
                          ) : (
                            <div>{item.content.value}</div>
                          )}
                        </div>
                      </div>
                      <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex'>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setEditingText(item.id)
                            setEditText(item.content.value)
                          }}
                          className='p-1 bg-[#D4A017] text-white rounded-tl-md'
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
                            deleteItem(item.id)
                          }}
                          className='p-1 bg-red-600 text-white rounded-tr-md'
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
                  )}

                {item.type === 'property-info' && (
                  <div className='relative h-full group'>
                    <div className='p-3 border-l-2 border-[#D4A017] text-black text-sm bg-gray-50/50 rounded-r'>
                      <div className='grid grid-cols-1 gap-3'>
                        <div className='flex items-center'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-4 w-4 mr-2 text-[#D4A017]'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                          <div>
                            <span className='font-medium'>
                              Date of Inventory:
                            </span>{' '}
                            {item.content.date}
                          </div>
                        </div>
                        <div className='flex items-center'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-4 w-4 mr-2 text-[#D4A017]'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                            />
                          </svg>
                          <div>
                            <span className='font-medium'>
                              Name Listing Person:
                            </span>{' '}
                            {item.content.listingPerson}
                          </div>
                        </div>
                        <div className='flex items-center'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-4 w-4 mr-2 text-[#D4A017]'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          <div>
                            <span className='font-medium'>
                              Owner Inventory List:
                            </span>{' '}
                            {typeof item.content.owners === 'string' 
              ? item.content.owners 
              : (Array.isArray(item.content.owners) && item.content.owners.length > 0)
                ? item.content.owners.join(', ')
                : 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100'>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem(item.id)
                        }}
                        className='p-1 bg-red-600 text-white rounded-tr-md'
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
                )}
                {item.type === 'logo' && (
                  <div className='relative h-full w-full group'>
                    <div className='w-full h-full overflow-hidden'>
                      {' '}
                      {/* Ajout de overflow-hidden pour éviter tout débordement */}
                      <Image
                        src='/images/logoinventory.jpg'
                        alt='Company Logo'
                        fill={true}
                        sizes='100%'
                        priority={true} // Priorité de chargement pour garantir l'affichage rapide
                        className='object-contain object-right-top' // Alignement en haut à droite
                        style={{
                          objectFit: 'contain',
                          objectPosition: 'right top',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    </div>
                    <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100'>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem(item.id)
                        }}
                        className='p-1 bg-red-600 text-white rounded-tr-md'
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
                )}

                {item.type === 'disclaimer' && (
                  <div className='relative h-full group'>
                    <div className='p-2 border-t border-[#D4A017] text-black text-xs italic text-gray-700 w-full'>
                      {editingText === item.id ? (
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={saveEditedText}
                          className='w-full p-1 border border-[#D4A017] resize-none bg-white text-black text-xs'
                          autoFocus
                        />
                      ) : (
                        item.content
                      )}
                    </div>
                    <div className='absolute top-0 right-0 opacity-0 group-hover:opacity-100'>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          startEditingText(item.id)
                          setEditText(item.content)
                        }}
                        className='p-1 bg-[#D4A017] text-white rounded-tl-md'
                      >
                        <svg
                          xmlns='http:www.w3.org/2000/svg'
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global styles for print */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pdf-content,
          #pdf-content * {
            visibility: visible;
          }
          #pdf-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: auto !important;
          }

          /* Hide buttons and controls in print */
          button,
          .group-hover\\:opacity-100,
          .opacity-0 {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
