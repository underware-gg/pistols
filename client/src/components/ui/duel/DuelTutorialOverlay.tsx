import React, { useState, useEffect } from 'react'
import { Modal } from 'semantic-ui-react'
import { DuelTutorialLevel, DUEL_TUTORIAL_LIST, TUTORIAL_DATA } from '/src/data/tutorialConstants'

interface DuelTutorialOverlayProps {
  tutorialType: DuelTutorialLevel
  open: boolean
}

export default function DuelTutorialOverlay({ tutorialType, open }: DuelTutorialOverlayProps) {
  const [isOpen, setIsOpen] = useState(open)

  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentDot, setCurrentDot] = useState(0)

  const tutorialParts = DUEL_TUTORIAL_LIST[tutorialType]
  const currentTutorial = TUTORIAL_DATA[tutorialParts[currentTutorialIndex]]
  const totalSlides = currentTutorial?.slides?.length || 0
  const totalDots = tutorialParts.reduce((total, tutorialId) => total + (TUTORIAL_DATA[tutorialId]?.slides?.length || 0), 0)

  useEffect(() => {
    setCurrentSlide(0)
    setCurrentTutorialIndex(0)
  }, [tutorialType])

  if (tutorialType === DuelTutorialLevel.NONE || !tutorialParts.length) {
    return null
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
    setIsOpen(false)
  }

  const isLastSlide = currentTutorialIndex === tutorialParts.length - 1 && currentSlide === totalSlides - 1

  return (
    <Modal
      open={isOpen}
      onClose={_close}
      className="modal"
      closeOnDimmerClick={false}
      closeOnDocumentClick={false}
    >
      <div className="tutorialContainer">
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
      </div>
    </Modal>
  )
}
