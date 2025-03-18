import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Modal } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { CARD_ASPECT_RATIO, CARD_FLIP_ROTATION } from '/src/data/cardConstants'
import TWEEN from '@tweenjs/tween.js'
import { useGameAspect } from '/src/hooks/useGameAspect'

const HAND_CARD_WIDTH = 195
const HAND_CARD_HEIGHT = HAND_CARD_WIDTH * (1080/1920)

export default function DuelistModal() {
  const { aspectWidth } = useGameAspect()
  const { selectedDuelistId, dispatchSelectDuelistId } = usePistolsContext()
  
  const isOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])

  const bottomCardRef = useRef<HTMLImageElement>(null)
  const topCardRef = useRef<HTMLImageElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const duelistCardRef = useRef<DuelistCardHandle>(null)

  const [showBack, setShowBack] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHandOpen, setIsHandOpen] = useState(false)

  const animate = (start: number, end: number, startScale: number, endScale: number, easing: (k: number) => number, onComplete?: () => void) => {
    const position = { y: start, scale: startScale }
    new TWEEN.Tween(position)
      .to({ y: end, scale: endScale }, 500)
      .easing(easing)
      .onUpdate(() => {
        if (modalContentRef.current) {
          modalContentRef.current.style.transform = `translate(-50%, -50%) translateY(${position.y}px) scale(${position.scale})`
        }
      })
      .onComplete(() => onComplete?.())
      .start()

    const animate = () => {
      TWEEN.update()
      if (modalContentRef.current) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  const animateFlip = (shouldShowBack: boolean) => {
    // First animation: scale down to 0.8
    setIsAnimating(true)
    new TWEEN.Tween({ scale: 1 })
      .to({ scale: 0.8 }, 400)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ scale }) => {
        if (modalContentRef.current) {
          modalContentRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`
        }
      })
      .onComplete(() => {
        setIsHandOpen(true)
        // Second animation: quick scale up to 1.2
        new TWEEN.Tween({ scale: 0.8 })
          .to({ scale: 1.2 }, 100)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(({ scale }) => {
            if (modalContentRef.current) {
              modalContentRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`
            }
          })
          .start()
          

        console.log('shouldShowBack', shouldShowBack)
        setTimeout(() => {
          duelistCardRef.current?.setScale([2, 1], 600, TWEEN.Easing.Quadratic.InOut, TWEEN.Interpolation.Bezier)
          duelistCardRef.current?.flip(!shouldShowBack, !shouldShowBack, 600, CARD_FLIP_ROTATION, TWEEN.Easing.Quadratic.InOut)

          setTimeout(() => {
            // Fourth animation: scale back to 1
            new TWEEN.Tween({ scale: 1.2 })
              .to({ scale: 1 }, 400)
              .easing(TWEEN.Easing.Quadratic.InOut)
              .onUpdate(({ scale }) => {
                if (modalContentRef.current) {
                  modalContentRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`
                }
              })
              .start()

            setTimeout(() => {
              setShowBack(shouldShowBack)
              setIsHandOpen(false)
              setIsAnimating(false)
            }, 300)
          }, 300)
        }, 50)
      })
      .start()
  }

  useEffect(() => {
    if (isOpen) {
      setIsHandOpen(false)
      setShowBack(false)
      setIsAnimating(true)
      animate(1000, 0, 0.5, 1, TWEEN.Easing.Circular.Out, () => {
        setIsAnimating(false)
      })
    }
  }, [isOpen])

  const _close = () => {
    setIsAnimating(true)
    animate(0, 1000, 1, 0.5, TWEEN.Easing.Cubic.In, () => {
      dispatchSelectDuelistId(0n)
      setIsAnimating(false)
    })
  }

  return (
    <Modal
      basic
      size='fullscreen'
      onClose={() => _close()}
      open={isOpen}
      className=''
    >
      <div className='DuelistModalContainer NoMouse NoDrag'>
        <div className="DuelistModal NoMouse NoDrag" ref={modalContentRef}>
          <img 
            ref={bottomCardRef}
            className='HandCard NoMouse NoDrag' 
            src={isHandOpen || showBack ? '/images/ui/hand_card_single_bottom_open.png' : '/images/ui/hand_card_single_bottom_closed.png'}
            style={{
              width: aspectWidth(HAND_CARD_WIDTH),
              height: aspectWidth(HAND_CARD_HEIGHT)
            }}
          />
          <DuelistCard
            ref={duelistCardRef}
            duelistId={Number(selectedDuelistId)}
            isSmall={false}
            isLeft={true}
            isVisible={true}
            instantVisible={true}
            isFlipped={true}
            instantFlip={true}
            isHanging={false}
            isHighlightable={false}
            isAnimating={isAnimating}
            width={36 * CARD_ASPECT_RATIO}
            height={36}
            showBack={showBack}
            animateFlip={animateFlip}
          />
          {!isHandOpen && !showBack &&
            <img 
              ref={topCardRef}
              className='HandCard NoMouse NoDrag' 
              src='/images/ui/hand_card_single_top.png'
              style={{
                width: aspectWidth(HAND_CARD_WIDTH),
                height: aspectWidth(HAND_CARD_HEIGHT)
              }}
            />
          }
        </div>
      </div>
    </Modal>
  )
}
