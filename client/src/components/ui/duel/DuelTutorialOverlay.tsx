import React, { useEffect, useState } from 'react'
import { Modal } from 'semantic-ui-react'
import { DuelTutorialLevel, DUEL_TUTORIAL_LIST, TUTORIAL_DATA } from '/src/data/tutorialConstants'
import { Opener } from '/src/hooks/useOpener'
import { CustomIcon } from '../Icons'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ActionButton } from '../Buttons'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'

interface DuelTutorialOverlayProps {
  tutorialType?: DuelTutorialLevel
  opener: Opener,
  onComplete?: () => void
}

export default function DuelTutorialOverlay({ tutorialType, opener, onComplete }: DuelTutorialOverlayProps) {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSetScene } = usePistolsScene()
  
  const [hasTyped, setHasTyped] = useState(false)
  const [selectedTutorialType, setSelectedTutorialType] = useState<DuelTutorialLevel | undefined>(tutorialType)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentDot, setCurrentDot] = useState(0)

  const tutorialParts = selectedTutorialType ? DUEL_TUTORIAL_LIST[selectedTutorialType] : []
  const currentTutorial = tutorialParts.length > 0 ? TUTORIAL_DATA[tutorialParts[currentTutorialIndex]] : null
  const totalSlides = currentTutorial?.slides?.length || 0
  const totalDots = tutorialParts.reduce((total, tutorialId) => total + (TUTORIAL_DATA[tutorialId]?.slides?.length || 0), 0)

  useEffect(() => {
    setSelectedTutorialType(tutorialType)
    setCurrentSlide(0)
    setCurrentTutorialIndex(0)
    setCurrentDot(0)
    setHasTyped(tutorialType ? true : false)
  }, [tutorialType])

  useEffect(() => {
    console.log('opener.isOpen', opener.isOpen)
  }, [opener.isOpen])

  const handleSelectTutorialType = (type: DuelTutorialLevel) => {
    setSelectedTutorialType(type)
    setCurrentSlide(0)
    setCurrentTutorialIndex(0)
    setCurrentDot(0)
  }

  const handleNext = () => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide(prev => prev + 1)
        setCurrentDot(prev => prev + 1)
      } else if (currentTutorialIndex < tutorialParts.length - 1) {
        setCurrentTutorialIndex(prev => prev + 1)
        setCurrentSlide(0)
        setCurrentDot(prev => prev + 1)
      }
      setIsTransitioning(false)
    }, 300)
  }

  const handlePrevious = () => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setTimeout(() => {
      if (currentSlide > 0) {
        setCurrentSlide(prev => prev - 1)
        setCurrentDot(prev => prev - 1)
      } else if (currentTutorialIndex > 0) {
        setCurrentTutorialIndex(prev => prev - 1)
        setCurrentSlide(TUTORIAL_DATA[tutorialParts[currentTutorialIndex - 1]].slides.length - 1)
        setCurrentDot(prev => prev - 1)
      }
      setIsTransitioning(false)
    }, 300)
  }

  const _close = () => {
    onComplete?.()
    opener.close()
    setSelectedTutorialType(undefined)
  }

  const isLastSlide = currentTutorialIndex === tutorialParts.length - 1 && currentSlide === totalSlides - 1

  useEffect(() => {
    if (!opener.isOpen) return

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (isLastSlide) {
          _close()
        } else {
          handleNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [opener.isOpen, isLastSlide, _close, handleNext])

  const renderTutorialSelector = () => {
    const tutorialLevels = Object.values(DuelTutorialLevel).filter(level => level !== DuelTutorialLevel.NONE);
    const firstColumnItems = tutorialLevels.slice(0, 8);
    const secondColumnItems = tutorialLevels.slice(8);
    
    return (
      <>
        <h2 className="tutorialTitle">Select Tutorial</h2>
        <div className="tutorialSelectorList" style={{ 
          width: '100%', 
          padding: aspectWidth(1),
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: aspectWidth(0.8),
          maxHeight: aspectHeight(80),
          overflow: 'hidden',
          gridAutoFlow: 'column'
        }}>
          {/* First column */}
          {firstColumnItems.map((level, index) => (
            <div 
              key={level}
              onClick={() => handleSelectTutorialType(level as DuelTutorialLevel)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              style={{ 
                padding: aspectWidth(0.6),
                cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid transparent',
                borderRadius: aspectWidth(0.3),
                transition: 'all 0.2s ease-in-out',
                transform: 'scale(1)',
                height: aspectHeight(6.4),
                display: 'flex',
                alignItems: 'center',
                gridColumn: 1
              }}
            >
              <div 
                style={{ 
                  width: '100%', 
                  textAlign: 'left',
                  color: '#ffffff',
                  fontSize: aspectWidth(1.6),
                  fontWeight: '400',
                  padding: `0 ${aspectWidth(0.5)}px`
                }}
              >
                {index + 1}. {level.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
                  return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                })}
              </div>
            </div>
          ))}
          
          {/* Second column */}
          {secondColumnItems.map((level, index) => (
            <div 
              key={level}
              onClick={() => handleSelectTutorialType(level as DuelTutorialLevel)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              style={{ 
                padding: aspectWidth(0.6),
                cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid transparent',
                borderRadius: aspectWidth(0.3),
                transition: 'all 0.2s ease-in-out',
                transform: 'scale(1)',
                height: aspectHeight(6.4),
                display: 'flex',
                alignItems: 'center',
                gridColumn: 2
              }}
            >
              <div 
                style={{ 
                  width: '100%', 
                  textAlign: 'left',
                  color: '#ffffff',
                  fontSize: aspectWidth(1.6),
                  fontWeight: '400',
                  padding: `0 ${aspectWidth(0.5)}px`
                }}
              >
                {8 + index + 1}. {level.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
                  return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className='tutorialGoToDuelButton'>
         <ActionButton large fill important label='Go to Interactive Duel!' onClick={() => {
          _close()
          dispatchSetScene(SceneName.Tutorial)
         }} /> 
        </div>
      </>
    )
  }

  const renderTutorialContent = () => {
    return (
      <>
        {!hasTyped && (
          <CustomIcon icon name='left-arrow' onClick={() => setSelectedTutorialType(undefined)} size='big' disabled={false} className='YesMouse tutorialTopLeftArrow'/>
        )}        
        <h2 className="tutorialTitle">
          {currentTutorial.tutorialName}
        </h2>

        <img
          src={currentTutorial.slides[currentSlide].imagePath}
          alt="Tutorial"
          className="tutorialImage"
        />

        <p className="tutorialText">
          {currentTutorial.slides[currentSlide].tutorialDescriptions}          
        </p>

        <div className="tutorialNavigationContainer">
          <button
            onClick={handlePrevious}
            disabled={currentTutorialIndex === 0 && currentSlide === 0}
            className={`tutorialButton YesMouse ${currentTutorialIndex === 0 && currentSlide === 0 ? 'tutorialButtonDisabled' : ''}`}
          >
            ← Previous
          </button>

          <div className="tutorialDotsContainer">
            {Array.from({length: totalDots}).map((_, index) => (
              <div 
                key={index}
                className={`tutorialDot ${index === currentDot ? 'tutorialDotActive' : 
                    index < currentDot ? 'tutorialDotPassed' : 'tutorialDotFuture'}`}
              />
            ))}
          </div>

          <button
            onClick={isLastSlide ? _close : handleNext}
            className="tutorialButton YesMouse NoDrag"
          >
            {isLastSlide ? 'Finish' : 'Next →'}
          </button>
        </div>
      </>
    )
  }

  return (
    <Modal
      open={opener.isOpen}
      onClose={_close}
      className={`modalNoBorder NoDrag ${opener.isOpen ? 'YesMouse' : 'NoMouse'}`}
      closeOnDimmerClick={false}
      closeOnDocumentClick={false}
    >
      <div className='tutorialContainer'>
        <div 
          className={'YesMouse NoDrag tutorialCloseButton'} 
          onClick={_close}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        {!selectedTutorialType ? renderTutorialSelector() : renderTutorialContent()}
      </div>
    </Modal>
  )
}
