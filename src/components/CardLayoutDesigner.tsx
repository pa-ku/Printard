import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, Upload, FileImage, Sun, Moon, Trash } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import logo from '@/assets/printard.webp'
import {CARD_SIZES,PAPER_SIZES} from '../CONFIG_SIZES'

type PaperSize = keyof typeof PAPER_SIZES
type CardSize = keyof typeof CARD_SIZES
type ImageVAlign = 'top' | 'center' | 'bottom'

interface CardData {
  id: string
  image?: string
}



export const CardLayoutDesigner = () => {
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [cardSize, setCardSize] = useState<CardSize>('poker')
  const [cards, setCards] = useState<CardData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [imageVAlign, setImageVAlign] = useState<ImageVAlign>('center')
  const [repeatFirst, setRepeatFirst] = useState<boolean>(false)

  const calculateLayout = useCallback(() => {
    const paper = PAPER_SIZES[paperSize]
    const card = CARD_SIZES[cardSize]
    
    // Minimum margin of 10mm, but adjust if cards are too large
    const minMargin = 10
    const maxCardsPerRow = Math.max(1, Math.floor((paper.width - 2 * minMargin) / card.width))
    const maxCardsPerCol = Math.max(1, Math.floor((paper.height - 2 * minMargin) / card.height))
    
    // Calculate actual spacing between cards
    const totalHorizontalSpace = paper.width - 2 * minMargin
    const totalVerticalSpace = paper.height - 2 * minMargin
    
    const cardsPerRow = Math.min(maxCardsPerRow, Math.max(1, Math.floor(totalHorizontalSpace / card.width)))
    const cardsPerCol = Math.min(maxCardsPerCol, Math.max(1, Math.floor(totalVerticalSpace / card.height)))
    
    const spacingX = (totalHorizontalSpace - cardsPerRow * card.width) / (cardsPerRow + 1)
    const spacingY = (totalVerticalSpace - cardsPerCol * card.height) / (cardsPerCol + 1)
    
    const totalCards = cardsPerRow * cardsPerCol

    return { 
      cardsPerRow, 
      cardsPerCol, 
      totalCards, 
      spacingX, 
      spacingY, 
      margin: minMargin 
    }
  }, [paperSize, cardSize])

  const layout = calculateLayout()
  const { spacingX, spacingY, margin } = layout

  // Sync cards array size with computed layout outside of render
  // Preserve existing images by index
  useEffect(() => {
    if (cards.length !== layout.totalCards) {
      setCards((prev) => {
        const next: CardData[] = Array.from({ length: layout.totalCards }, (_, i) => ({
          id: `card-${i}`,
          image: prev[i]?.image,
        }))
        return next
      })
    }
  }, [layout.totalCards, cards.length])

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId)
    fileInputRef.current?.click()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedCardId) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setCards((prev) => {
        // Always set the selected card
        let next = prev.map((card) =>
          card.id === selectedCardId ? { ...card, image: imageUrl } : card
        )
        // If repeatFirst is enabled, mirror the upload into the first card as the source
        if (repeatFirst) {
          if (next.length > 0) {
            next = next.map((c, idx) => (idx === 0 ? { ...c, image: imageUrl } : c))
          }
        }
        return next
      })
      toast.success('Imagen cargada correctamente')
    }
    reader.readAsDataURL(file)
    setSelectedCardId(null)
  }

  const downloadPDF = async () => {
    const paper = PAPER_SIZES[paperSize]
    const card = CARD_SIZES[cardSize]

    // Create PDF with correct orientation
    const pdf = new jsPDF({
      orientation: paper.width > paper.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: (paperSize === 'A3' ? 'a3' : 'a4')
    })

    let cardIndex = 0

    // Create a function to load image and get its dimensions
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    // Process each card
    for (let row = 0; row < layout.cardsPerCol; row++) {
      for (let col = 0; col < layout.cardsPerRow; col++) {
        if (cardIndex >= cards.length) break

        const x = margin + col * (card.width + spacingX) + spacingX
        const y = margin + row * (card.height + spacingY) + spacingY

        const currentCard = cards[cardIndex]
        const effectiveImage = repeatFirst ? cards[0]?.image : currentCard?.image
        if (effectiveImage) {
          try {
            const img = await loadImage(effectiveImage)
            const imgAspect = img.width / img.height
            const cardAspect = card.width / card.height
            
            // Cover behavior: scale image so it fully covers the card without distortion,
            // centered, and then mask overflow with white rectangles.
            const padding = 0 // inner padding in mm; set to 0 for full bleed inside the card
            const innerW = card.width - 2 * padding
            const innerH = card.height - 2 * padding

            let drawWidth: number
            let drawHeight: number

            if (imgAspect > cardAspect) {
              // Image wider relative to card: fit by height (will overflow width)
              drawHeight = innerH
              drawWidth = drawHeight * imgAspect
            } else {
              // Image taller relative to card: fit by width (will overflow height)
              drawWidth = innerW
              drawHeight = drawWidth / imgAspect
            }

            // Position inside the card rect according to vertical alignment
            const drawX = x + (card.width - drawWidth) / 2
            const verticalDelta = card.height - drawHeight // negative => overflow (image taller than card)
            let drawY = y
            if (imageVAlign === 'top') {
              drawY = y
            } else if (imageVAlign === 'bottom') {
              drawY = y + verticalDelta
            } else {
              // center
              drawY = y + verticalDelta / 2
            }

            // Place image
            pdf.addImage(effectiveImage, 'JPEG', drawX, drawY, drawWidth, drawHeight)

            // Mask overflow (simulate clipping to the card rectangle)
            pdf.setFillColor(255, 255, 255)

            // Compute overflow amounts on each side
            const overflowLeft = Math.max(0, x - drawX)
            const overflowRight = Math.max(0, (drawX + drawWidth) - (x + card.width))
            const overflowTop = Math.max(0, y - drawY)
            const overflowBottom = Math.max(0, (drawY + drawHeight) - (y + card.height))

            if (overflowLeft > 0) {
              pdf.rect(x - overflowLeft, y, overflowLeft, card.height, 'F')
            }
            if (overflowRight > 0) {
              pdf.rect(x + card.width, y, overflowRight, card.height, 'F')
            }
            if (overflowTop > 0) {
              pdf.rect(x, y - overflowTop, card.width, overflowTop, 'F')
            }
            if (overflowBottom > 0) {
              pdf.rect(x, y + card.height, card.width, overflowBottom, 'F')
            }
          } catch (error) {
            console.warn('Error adding image to PDF:', error)
          }
        }

        // Draw card border on top so it sits above the image/masks
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(x, y, card.width, card.height)

        cardIndex++
      }
    }

    const filename = `Printard-${paperSize}-${cardSize}.pdf`
    pdf.save(filename)
    toast.success('PDF descargado correctamente')
  }

  const clearAllImages = () => {
    setCards((prev) => prev.map((card) => ({ ...card, image: undefined })))
    toast.success('Todas las imágenes han sido eliminadas')
  }

  function handleTheme() {
    const html = document.querySelector('html')
    if (!html) return

    const isDark = html.classList.toggle('dark')
    toast.success(`Tema ${isDark ? 'oscuro' : 'claro'} activado`)
  }

  return (
    <div className='h-screen flex bg-background'>
      {/* Sidebar */}
      <div className='w-80 bg-sidebar border-r border-border p-6 flex flex-col gap-6'>
        <div>
          <h1 className='text-2xl flex gap-1 font-bold items-center  text-foreground mb-2'>
            <img className='size-8' src={logo} alt='' />
            rintard
          </h1>
        </div>
        <div className='gap-2 grid grid-cols-3'>
          <button
          className="btn-default"
            onClick={handleTheme}
            disabled={cards.length === 0}
          >
            <Moon className='size-5'/>
          </button>
          <button
            onClick={downloadPDF}
            className="btn-default"
            disabled={layout.totalCards === 0}
          >
            <Download className='size-5' />
          PDF
          </button>

          <button
            onClick={clearAllImages}
            className="btn-default"
            disabled={!cards.some((card) => card.image)}
          >
            <Trash className='size-5' />
          </button>
        </div>

        <div className='space-y-4'>
          <div>
            <Label htmlFor='paper-size' className='text-sm font-medium'>
              Tamaño de papel
            </Label>
            <Select
              value={paperSize}
              onValueChange={(value: PaperSize) => setPaperSize(value)}
            >
              <SelectTrigger className='mt-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='A4'>A4 (210×297mm)</SelectItem>
                <SelectItem value='A3'>A3 (297×420mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='card-size' className='text-sm font-medium'>
              Tamaño de carta
            </Label>
            <Select
              value={cardSize}
              onValueChange={(value: CardSize) => setCardSize(value)}
            >
              <SelectTrigger className='mt-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CARD_SIZES).map(([key, { name }]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='image-valign' className='text-sm font-medium'>
              Alineación vertical de imagen
            </Label>
            <Select
              value={imageVAlign}
              onValueChange={(value) => setImageVAlign(value as ImageVAlign)}
            >
              <SelectTrigger className='mt-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='top'>Arriba</SelectItem>
                <SelectItem value='center'>Centro</SelectItem>
                <SelectItem value='bottom'>Abajo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-2 mt-2'>
            <input
              id='repeat-first'
              type='checkbox'
              checked={repeatFirst}
              onChange={(e) => setRepeatFirst(e.target.checked)}
              className='h-4 w-4 accent-pink-600'
            />
            <Label htmlFor='repeat-first' className='text-sm font-medium'>
              Repetir la primera imagen
            </Label>
          </div>
        </div>

        <Card className='p-4 bg-muted/50'>
          <div className='text-sm space-y-2'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Cartas por fila:</span>
              <span className='font-medium'>{layout.cardsPerRow}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Filas:</span>
              <span className='font-medium'>{layout.cardsPerCol}</span>
            </div>
            <div className='flex justify-between border-t pt-2'>
              <span className='text-muted-foreground'>Total:</span>
              <span className='font-semibold'>{layout.totalCards} cartas</span>
            </div>
          </div>
        </Card>

       
      </div>

      {/* Canvas Area */}
      <div className='flex-1   p-6 bg-canvas overflow-auto'>
        <div className='flex items-center  justify-center min-h-full'>
          <div
            className='bg-gray-200 dark:bg-black shadow-card  rounded-lg p-2'
            style={{
              width: `${PAPER_SIZES[paperSize].width * 2.7}px`,
              height: `${PAPER_SIZES[paperSize].height * 3}px`,
              aspectRatio: `${PAPER_SIZES[paperSize].width} / ${PAPER_SIZES[paperSize].height}`,
            }}
          >
            <div
              className='grid gap-2 h-full'
              style={{
                gridTemplateColumns: `repeat(${layout.cardsPerRow}, 1fr)`,
                gridTemplateRows: `repeat(${layout.cardsPerCol}, 1fr)`,
              }}
            >
              {cards.map((card, idx) => {
                const effectiveImage = repeatFirst ? cards[0]?.image : card.image
                return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className='border-2 border-dashed border-border rounded-lg cursor-pointer 
                           hover:border-pink-500  transition-all duration-200
                           flex items-center justify-center text-muted-foreground hover:text-pink-500
                            relative overflow-hidden bg-card-empty'
                  style={{
                    aspectRatio: `${CARD_SIZES[cardSize].width} / ${CARD_SIZES[cardSize].height}`,
                  }}
                >
                  {effectiveImage ? (
                    <img
                      src={effectiveImage}
                      alt='Card'
                      className='w-full h-full object-cover rounded-md'
                      style={{
                        objectPosition:
                          imageVAlign === 'top'
                            ? 'center top'
                            : imageVAlign === 'bottom'
                            ? 'center bottom'
                            : 'center',
                      }}
                    />
                  ) : (
                    <div className='flex flex-col items-center gap-2 p-2'>
                      <Upload className='w-6 h-6 transition-transform' />
                      <span className='text-xs text-center font-medium'>
                        Click para subir imagen
                      </span>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleImageUpload}
        className='hidden'
      />
    </div>
  )
}