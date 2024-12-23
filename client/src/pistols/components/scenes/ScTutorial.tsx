import React, { useEffect, useState } from 'react'
import { usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { _currentScene } from '@/pistols/three/game'
import { InteractibleScene } from '@/pistols/three/InteractibleScene'
import { sceneBackgrounds } from '@/pistols/data/assets'
import AnimatedText from '../ui/AnimatedText'
import { ANIMATION_TIME_PER_LETTER, DELAY_BETWEEN_TEXTS, TUTORIAL_SCENE_DATA, TutorialScene } from '@/pistols/data/tutorialConstants'

export default function ScTutorial({ currentTutorialScene }: { currentTutorialScene: string }) {
  const { dispatchSetScene } = usePistolsScene()
  const [currentSceneData, setCurrentSceneData] = useState<TutorialScene>()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  
  const [displayText, setDisplayText] = useState('')
  const [totalDuration, setTotalDuration] = useState(0)

  useEffect(() => {
    (_currentScene as InteractibleScene).setSceneData(sceneBackgrounds[currentTutorialScene])
    setCurrentSceneData(TUTORIAL_SCENE_DATA[currentTutorialScene])
  }, [currentTutorialScene])

  useEffect(() => {
    setCurrentTextIndex(0)
    //TODO set skippable
    //TODO play sfx audios with delays
  }, [currentSceneData])

  useEffect(() => {
    // Calculate total duration whenever text index changes
    
    const currentText = currentSceneData?.texts[currentTextIndex].text
    
    const animationTime = currentText.length * ANIMATION_TIME_PER_LETTER
    const delayTime = (currentText.length - 1) * DELAY_BETWEEN_TEXTS
    
    setTotalDuration(animationTime + delayTime)
    setDisplayText(currentText)
  }, [currentTextIndex])

  const handleAnimationComplete = () => {
    setCurrentTextIndex(prev => prev + 1)
  }

  return (
    <div>
      <div className="">
        <AnimatedText 
          text={displayText} 
          duration={ANIMATION_TIME_PER_LETTER}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
    </div>
  )
}
