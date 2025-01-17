import React, { useState, useEffect } from 'react'
import { DuelTutorial } from '/src/data/tutorialConstants'

export enum BartenderPosition {
  Left = 'left',
  Center = 'center', 
  Right = 'right'
}

type TutorialStep = {
  text: string,
  bartenderPosition: BartenderPosition,
  overlayImage?: string // Path to overlay image
}

const TUTORIAL_STEPS: Record<DuelTutorial, TutorialStep[]> = {
  [DuelTutorial.NONE]: [],
  [DuelTutorial.SIMPLE]: [
    {
      text: "Welcome to your first duel! Let me show you around.",
      bartenderPosition: BartenderPosition.Center
    },
    {
      text: "These are your cards. You'll use them to plan your moves.",
      bartenderPosition: BartenderPosition.Left,
      overlayImage: '/assets/tutorials/cards-highlight.png'
    },
    {
      text: "Your opponent's stats are shown here. Keep an eye on their health!",
      bartenderPosition: BartenderPosition.Right,
      overlayImage: '/assets/tutorials/opponent-stats.png'
    }
  ],
  [DuelTutorial.FULL]: [
    {
      text: "Time to commit your moves! Click the cards in the order you want to play them.",
      bartenderPosition: BartenderPosition.Left,
      overlayImage: '/assets/tutorials/commit-cards.png'
    },
    {
      text: "Once you're happy with your selection, click commit to lock in your moves.",
      bartenderPosition: BartenderPosition.Center,
      overlayImage: '/assets/tutorials/commit-button.png'
    }
  ],
  [DuelTutorial.DUELISTS]: [
    {
      text: "Both duelists have committed their moves. Time for the reveal!",
      bartenderPosition: BartenderPosition.Center
    },
    {
      text: "Click reveal to show your cards and see how the duel plays out.",
      bartenderPosition: BartenderPosition.Right,
      overlayImage: '/assets/tutorials/reveal-button.png'
    }
  ]
}

export default function DuelTutorialOverlay({ tutorialType }: { tutorialType: DuelTutorial }) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = TUTORIAL_STEPS[tutorialType]

  useEffect(() => {
    setCurrentStep(0)
  }, [tutorialType])

  if (tutorialType === DuelTutorial.NONE || !steps.length || currentStep >= steps.length) {
    return null
  }

  const currentTutorial = steps[currentStep]

  return (
    <div className="TutorialOverlay">
      {currentTutorial.overlayImage && (
        <div className="TutorialMask">
          <img src={currentTutorial.overlayImage} alt="Tutorial highlight" />
        </div>
      )}
      
      <div className={`TutorialBartender ${currentTutorial.bartenderPosition}`}>
        {/* <Bartender /> */}
        <div className="TutorialText">
          {currentTutorial.text}
          <button 
            className="TutorialNext"
            onClick={() => setCurrentStep(prev => prev + 1)}
          >
            {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
