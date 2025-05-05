import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Modal } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { CARD_ASPECT_RATIO, CARD_FLIP_ROTATION } from '/src/data/cardConstants'
import TWEEN from '@tweenjs/tween.js'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useDuelistStack } from '/src/stores/duelistStore'
import SoulsStackGrid from '/src/components/cards/SoulsStackGrid'

const HAND_CARD_WIDTH = 195
const HAND_CARD_HEIGHT = HAND_CARD_WIDTH * (1080/1920)

export default function DuelistModal() {
  const { selectedDuelistId } = usePistolsContext()
  const isOpen = useMemo(() => (selectedDuelistId > 0n), [selectedDuelistId])
  return <>{isOpen && <_DuelistModal isOpen={isOpen} />}</>
}

function _DuelistModal({
  isOpen,
}: {
  isOpen: boolean
}) {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { selectedDuelistId, dispatchSelectDuelistId } = usePistolsContext()
  
  const bottomCardRef = useRef<HTMLImageElement>(null)
  const topCardRef = useRef<HTMLImageElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const duelistCardRef = useRef<DuelistCardHandle>(null)
  const soulsContainerRef = useRef<HTMLDivElement>(null)

  const [showBack, setShowBack] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHandOpen, setIsHandOpen] = useState(false)
  const [showSoulsStack, setShowSoulsStack] = useState(false)
  const [soulsData, setSoulsData] = useState<{duelistId: number, stackedDuelistIds: number[]}>({duelistId: 0, stackedDuelistIds: []})
  
  const { level } = useDuelistStack(Number(selectedDuelistId))

  const handleShowSouls = (duelistId: number, stackedDuelistIds: number[]) => {
    if (isAnimating || stackedDuelistIds.length === 0) return
    
    setSoulsData({ duelistId, stackedDuelistIds })
    animateSoulsTransition(true)
  }

  const handleCloseSouls = () => {
    if (isAnimating) return
    animateSoulsTransition(false)
  }

  const animateSoulsTransition = (show: boolean) => {
    if (isAnimating) return
    setIsAnimating(true)
    
    const cardContainer = modalContentRef.current
    const soulsContainer = soulsContainerRef.current
    
    if (!cardContainer || !soulsContainer) {
      setIsAnimating(false)
      return
    }
    
    const cardBottomPosition = aspectHeight(68)
    
    if (show) {
      soulsContainer.style.opacity = '0'
      soulsContainer.style.display = 'block'
    }
    
    const cardContainerTween = new TWEEN.Tween({ 
        y: show ? 0 : cardBottomPosition,
        scale: show ? 1 : 0.85
      })
      .to({ 
        y: show ? cardBottomPosition : 0,
        scale: show ? 0.85 : 1
      }, 600)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ y, scale }) => {
        cardContainer.style.transform = `translate(-50%, -50%) translateY(${y}px) scale(${scale})`
        cardContainer.style.zIndex = show ? '1' : '10'
      })
      .onComplete(() => {
        if (show) {
          cardContainer.style.pointerEvents = 'none'
        } else {
          setShowSoulsStack(false)
          cardContainer.style.pointerEvents = 'auto'
        }
      })
    
    const soulsContainerTween = new TWEEN.Tween({ 
        opacity: show ? 0 : 1
      })
      .to({ 
        opacity: show ? 1 : 0
      }, 600)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ opacity }) => {
        soulsContainer.style.opacity = `${opacity}`
      })
      .onComplete(() => {
        if (!show) {
          soulsContainer.style.display = 'none'
        }
        setIsAnimating(false)
        setShowSoulsStack(show)
      })
    
    if (show) {
      cardContainerTween.start()
      setTimeout(() => {
        soulsContainerTween.start()
      }, 100)
    } else {
      soulsContainerTween.start()
      setTimeout(() => {
        cardContainer.style.display = 'flex'
        cardContainerTween.start()
      }, 100)
    }
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
      setShowSoulsStack(false)
      setIsAnimating(true)
      
      if (modalContentRef.current) {
        modalContentRef.current.style.transform = `translate(-50%, -50%) translateY(1000px) scale(0.5)`
        modalContentRef.current.style.display = 'flex'
        modalContentRef.current.style.opacity = '1'
      }
      
      if (soulsContainerRef.current) {
        soulsContainerRef.current.style.display = 'none'
        soulsContainerRef.current.style.opacity = '0'
      }
      
      new TWEEN.Tween({ y: 1000, scale: 0.5 })
        .to({ y: 0, scale: 1 }, 500)
        .easing(TWEEN.Easing.Circular.Out)
        .onUpdate(({ y, scale }) => {
          if (modalContentRef.current) {
            modalContentRef.current.style.transform = `translate(-50%, -50%) translateY(${y}px) scale(${scale})`
          }
        })
        .onComplete(() => {
          setIsAnimating(false)
        })
        .start()
      
      const animate = () => {
        TWEEN.update()
        if (modalContentRef.current) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }
  }, [isOpen])

  // Handle keyboard escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSoulsStack && !isAnimating) {
          handleCloseSouls()
        } else if (!isAnimating) {
          _close()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSoulsStack, isAnimating])

  const _close = () => {
    setIsAnimating(true)
    
    new TWEEN.Tween({ y: 0, scale: 1 })
      .to({ y: 1000, scale: 0.5 }, 500)
      .easing(TWEEN.Easing.Cubic.In)
      .onUpdate(({ y, scale }) => {
        if (modalContentRef.current) {
          modalContentRef.current.style.transform = `translate(-50%, -50%) translateY(${y}px) scale(${scale})`
        }
      })
      .onComplete(() => {
        dispatchSelectDuelistId(0n)
        setIsAnimating(false)
      })
      .start()
    
    const animate = () => {
      TWEEN.update()
      if (modalContentRef.current) {
        requestAnimationFrame(animate)
      }
    }
    animate()
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
          <div 
            className="ModalBackgroundCover YesMouse" 
            onClick={() =>{
              if (showSoulsStack) {
                handleCloseSouls()
              } else {
                _close()
              }
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              zIndex: -1
            }}
          />
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
            showSouls={(selectedDuelistId, stackedDuelistIds) => {
              if (showSoulsStack) {
                handleCloseSouls()
              } else {
                handleShowSouls(selectedDuelistId, stackedDuelistIds)
              }
            }}
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
        
        <div 
          ref={soulsContainerRef} 
          className="SoulsStackModal NoMouse NoDrag"
          style={{ 
            display: 'none',
            opacity: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            width: aspectWidth(100),
            height: aspectHeight(90)
          }}
        >
          <SoulsStackGrid
            duelistId={soulsData.duelistId}
            stackedDuelistIds={soulsData.stackedDuelistIds}
            level={level}
            onClose={handleCloseSouls}
          />
        </div>
      </div>
    </Modal>
  )
}
