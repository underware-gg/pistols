import React, { useEffect, useState } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { SceneName } from '/src/data/assets'
import AnimatedText from '/src/components/ui/AnimatedText'
import { ANIMATION_TIME_PER_LETTER, DELAY_BETWEEN_TEXTS, DELAY_BETWEEN_SPEECH, TUTORIAL_SCENE_DATA, TutorialScene, TutorialText } from '/src/data/tutorialConstants'
import { AUDIO_ASSETS } from '/src/data/audioAssets'

export default function ScTutorial({ currentTutorialScene }: { currentTutorialScene: string }) {
  const { dispatchSetScene } = usePistolsScene()
  
  const [currentSceneData, setCurrentSceneData] = useState<TutorialScene>()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [canSkipText, setCanSkipText] = useState(false)
  
  const [displayText, setDisplayText] = useState<TutorialText>()
  const [totalDuration, setTotalDuration] = useState<number>(0)
  const [textDuration, setTextDuration] = useState<number>(0)

  useEffect(() => {
    if (!currentTutorialScene) return
    setCurrentTextIndex(-1);
    setCurrentSceneData(TUTORIAL_SCENE_DATA[currentTutorialScene]);
    (_currentScene as InteractibleScene).setSceneData(currentTutorialScene);
  }, [currentTutorialScene])

  useEffect(() => {
    setCurrentTextIndex(0)
    //TODO play sfx audios with delays
  }, [currentSceneData])

  useEffect(() => {
    if (currentTextIndex < 0) return

    if (currentTextIndex >= currentSceneData?.texts.length) {
      switch (currentTutorialScene) {
        case SceneName.Tutorial:
          dispatchSetScene(SceneName.TutorialScene2)
          break
        case SceneName.TutorialScene2:
          dispatchSetScene(SceneName.TutorialScene3) 
          break
        case SceneName.TutorialScene3:
          dispatchSetScene(SceneName.TutorialScene4)
          break
        case SceneName.TutorialScene4:
          dispatchSetScene(SceneName.TutorialScene5)
          break
      }
    } else {
      const currentText = currentSceneData?.texts[currentTextIndex]
    
      if (!currentText) return
      
      const animationTime = currentText.text.length * ANIMATION_TIME_PER_LETTER
      const soundDuration = AUDIO_ASSETS[currentText.voice]?.duration || 0
      const delayTime = soundDuration > 0 ? DELAY_BETWEEN_SPEECH : DELAY_BETWEEN_TEXTS
      
      const totalDuration = Math.max(animationTime, soundDuration) + delayTime
      
      setTextDuration(animationTime)
      setTotalDuration(totalDuration)
      setDisplayText(currentText)
    }
  }, [currentTextIndex])

  let skipTimeout: NodeJS.Timeout
  let nextTextTimeout: NodeJS.Timeout

  useEffect(() => {
    if (textDuration > 0) {
      skipTimeout = setTimeout(() => {
        setCanSkipText(true)
      }, textDuration * 0.8)

      nextTextTimeout = setTimeout(() => {
        setCurrentTextIndex(prev => prev + 1)
        setCanSkipText(false)
      }, totalDuration)
    }

    return () => {
      clearTimeout(skipTimeout)
      clearTimeout(nextTextTimeout)
    }
  }, [totalDuration, textDuration])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        handleSkipText();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canSkipText]);

  const handleAnimationComplete = () => {
    
  }

  const handleSkipText = () => {
    if (!canSkipText) return

    clearTimeout(skipTimeout)
    clearTimeout(nextTextTimeout)
    setCanSkipText(false)
    setCurrentTextIndex(prev => prev + 1)
  }

  return (
    <div className="tutorialContainer NoMouse NoDrag" >
      <div className="tutorialBackground" />
      <div className="tutorialContent">
        <div className="speakerName">
          {displayText?.characterName}
        </div>

        <div className="tutorialDivider"/>

        <div className="textContainer">
          <AnimatedText
            text={displayText?.text}
            delayPerCharacter={ANIMATION_TIME_PER_LETTER}
            onAnimationComplete={handleAnimationComplete}
          />
        </div>

        {canSkipText && (
          <div className="indicator">
            ♦
          </div>
        )}

        {currentSceneData?.hasSkipButton && (
          <div 
            className="nextButton YesMouse"
            onClick={handleSkipText}
          >
            <span className="nextText">Next</span>
            <div className="nextIcon">
              <img className="svg" src="/icons/icon_spacebar.svg" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
