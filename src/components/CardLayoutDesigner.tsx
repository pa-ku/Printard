import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, Upload, FileImage, Sun } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import logo from '@/assets/printard.webp'
import {CARD_SIZES,PAPER_SIZES} from '../CONFIG_SIZES'

type PaperSize = 'A3' | 'A4'
type CardSize = 'poker' | 'bridge' | 'mini' | 'square'

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

  const calculateLayout = useCallback(() => {
    const paper = PAPER_SIZES[paperSize]
    const card = CARD_SIZES[cardSize]

    const margin = 5
    const availableWidth = paper.width - 2 * margin
    const availableHeight = paper.height - 2 * margin

    const cardsPerRow = Math.floor(availableWidth / card.width)
    const cardsPerCol = Math.floor(availableHeight / card.height)
    const totalCards = cardsPerRow * cardsPerCol

    // Generar cartas si no existen
    if (cards.length !== totalCards) {
      const newCards: CardData[] = Array.from(
        { length: totalCards },
        (_, i) => ({
          id: `card-${i}`,
          image: cards[i]?.image,
        })
      )
      setCards(newCards)
    }

    return { cardsPerRow, cardsPerCol, totalCards }
  }, [paperSize, cardSize, cards.length])

  const layout = calculateLayout()

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
      setCards((prev) =>
        prev.map((card) =>
          card.id === selectedCardId ? { ...card, image: imageUrl } : card
        )
      )
      toast.success('Imagen cargada correctamente')
    }
    reader.readAsDataURL(file)
    setSelectedCardId(null)
  }

  const downloadPDF = () => {
    const paper = PAPER_SIZES[paperSize]
    const card = CARD_SIZES[cardSize]

    // Crear PDF con orientación portrait
    const pdf = new jsPDF({
      orientation: paper.width > paper.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: paperSize === 'A4' ? 'a4' : 'a3',
    })

    const margin = 10
    let cardIndex = 0

    for (let row = 0; row < layout.cardsPerCol; row++) {
      for (let col = 0; col < layout.cardsPerRow; col++) {
        if (cardIndex >= cards.length) break

        const x = margin + col * card.width
        const y = margin + row * card.height

        // Dibujar borde de la carta
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(x, y, card.width, card.height)

        const currentCard = cards[cardIndex]
        if (currentCard?.image) {
          try {
            pdf.addImage(
              currentCard.image,
              'JPEG',
              x + 1,
              y + 1,
              card.width - 2,
              card.height - 2
            )
          } catch (error) {
            console.warn('Error al añadir imagen al PDF:', error)
          }
        }

        cardIndex++
      }
    }

    const filename = `layout-cartas-${paperSize}-${cardSize}-${new Date().getTime()}.pdf`
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
          <h1 className='text-2xl flex gap-2 font-bold items-center  text-foreground mb-2'>
            <img className='size-8' src={logo} alt='' />
            Printard
          </h1>
          <p className='text-muted-foreground text-sm'>
            Crea layouts perfectos para tus cartas de juego
          </p>
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

        <div className='space-y-3 mt-auto'>
          <Button
            onClick={handleTheme}
            className='w-full bg-pink-800/20 hover:bg-pink-800/30 text-pink-500 '
            disabled={cards.length === 0}
          >
            Cambiar Tema
          </Button>
          <Button
            onClick={downloadPDF}
            className='w-full bg-pink-800/20 hover:bg-pink-800/30 text-pink-500 '
            disabled={cards.length === 0}
          >
            <Download className='w-4 h-4 mr-2' />
            Descargar PDF
          </Button>

          <Button
            onClick={clearAllImages}
            variant='outline'
            className='w-full'
            disabled={!cards.some((card) => card.image)}
          >
            <FileImage className='w-4 h-4 mr-2' />
            Limpiar imágenes
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className='flex-1   p-6 bg-canvas overflow-auto'>
        <div className='flex items-center  justify-center min-h-full'>
          <div
            className='bg-card shadow-card  rounded-lg p-6 border'
            style={{
              width: `${PAPER_SIZES[paperSize].width * 2}px`,
              height: `${PAPER_SIZES[paperSize].height * 2}px`,
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
              {cards.map((card) => (
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
                  {card.image ? (
                    <img
                      src={card.image}
                      alt='Card'
                      className='w-full h-full object-cover rounded-md'
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
              ))}
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
