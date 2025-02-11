import React, { useEffect, useRef, useState } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { SceneName, TextureName } from '/src/data/assets'
import { ANIMATION_TIME_PER_LETTER, DELAY_BETWEEN_TEXTS, DELAY_BETWEEN_SPEECH, TUTORIAL_SCENE_DATA, TutorialScene, TutorialText, DuelTutorialLevel } from '/src/data/tutorialConstants'
import { AUDIO_ASSETS } from '/src/data/audioAssets'
import { useConnectToSelectedChain, useDojoStatus, useDojoSystemCalls, useSelectedChain } from '@underware_gg/pistols-sdk/dojo'
import { useTutorialLevel, useTutorialPlayerId } from '/src/hooks/useTutorial'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useGameEvent } from '/src/hooks/useGameEvent'
import AnimatedText from '../ui/AnimatedText'
import * as TWEEN from '@tweenjs/tween.js'
import { CardPack } from '../ui/CardPack'
import DuelTutorialOverlay from '../ui/duel/DuelTutorialOverlay'

export default function ScTutorial({ currentTutorialScene }: { currentTutorialScene: string }) {
  // Scene & Context
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSetTutorialLevel } = usePistolsContext()
  
  // Game Events
  const { value: itemHovered } = useGameEvent('hover_item', null)
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  // Web3 Hooks
  const { isConnecting } = useSelectedChain()
  const { isLoading, isError } = useDojoStatus()
  const { disconnect } = useDisconnect()
  const { account } = useAccount()
  const { connect } = useConnectToSelectedChain(handleConnectionSuccess)
  const { tutorial } = useDojoSystemCalls()

  // Tutorial State
  const { duelId: duelIdSimple } = useTutorialLevel(1)
  const { duelId: duelIdFull } = useTutorialLevel(2)
  const { playerId } = useTutorialPlayerId()
  const [currentSceneData, setCurrentSceneData] = useState<TutorialScene>()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [canSkipText, setCanSkipText] = useState(false)
  const [displayText, setDisplayText] = useState<TutorialText>()
  const [totalDuration, setTotalDuration] = useState<number>(0)
  const [textDuration, setTextDuration] = useState<number>(0)
  const [flashOpacity, setFlashOpacity] = useState(0)
  const [textOpacity, setTextOpacity] = useState(0)
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false)
  const [showCardPack, setShowCardPack] = useState(false)
  const [cardPackClickable, setCardPackClickable] = useState(false)
  const textOpacityRef = useRef(0)
  const currentTween = useRef<TWEEN.Tween<any> | null>(null)

  // Scene Initialization & Cleanup
  useEffect(() => {
    if (!currentTutorialScene) return
    
    initializeScene()

    return () => {
      // Reset all state when component unmounts
      setCurrentSceneData(undefined)
      setCurrentTextIndex(0)
      setCanSkipText(false)
      setDisplayText(undefined)
      setFlashOpacity(0)
      setTextOpacity(0)
      setShowTutorialOverlay(false)
      setShowCardPack(false)
      setCardPackClickable(false)
      currentTween.current?.stop()
      currentTween.current = null
    }
  }, [currentTutorialScene])

  // Text Animation & Progression
  useEffect(() => {
    if (currentTextIndex < 0) return
    if (currentTextIndex >= currentSceneData?.texts.length) {
      handleSceneProgression()
      return
    }

    handleTextDisplay()
  }, [currentTextIndex])

  // Text Animation Timers
  useEffect(() => {
    if (textDuration <= 0) return

    const skipTimeout = setTimeout(() => setCanSkipText(true), textDuration * 0.8)
    const nextTextTimeout = setTimeout(() => {
      setCanSkipText(false)
      setCurrentTextIndex(prev => prev + 1)
    }, totalDuration)

    return () => {
      clearTimeout(skipTimeout)
      clearTimeout(nextTextTimeout)
    }
  }, [totalDuration, textDuration])

  // Keyboard Controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') handleSkipText()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canSkipText])

  // Scene-specific Effects
  useEffect(() => {
    if (currentTutorialScene === SceneName.TutorialScene4) {
      handleDemonSceneHover()
    }
  }, [itemHovered])

  useEffect(() => {
    if (!itemClicked) return
    handleItemClick()
  }, [itemClicked, timestamp])

  useEffect(() => {
    handleTutorialCreation()
  }, [currentTutorialScene, duelIdSimple, duelIdFull])

  // Helper Functions
  function initializeScene() {
    setCurrentTextIndex(-1)
    setDisplayText(undefined)
    setCurrentSceneData(TUTORIAL_SCENE_DATA[currentTutorialScene])

    setTimeout(() => setCurrentTextIndex(0), 500)
  }

  function handleTextDisplay() {
    if (currentTextIndex >= (currentSceneData?.texts.length || 0)) return
    if (currentTutorialScene === SceneName.TutorialScene4 && currentTextIndex > 0) return

    const currentText = currentSceneData?.texts[currentTextIndex]
    animateTextOpacity(1)
    if (currentTutorialScene === SceneName.TutorialScene4) {
    }
    if (!currentText) return

    const animationTime = currentText.text.length * ANIMATION_TIME_PER_LETTER
    const soundDuration = AUDIO_ASSETS[currentText.voice]?.duration || 0
    const delayTime = soundDuration > 0 ? DELAY_BETWEEN_SPEECH : DELAY_BETWEEN_TEXTS
    
    setTextDuration(animationTime)
    setTotalDuration(Math.max(animationTime, soundDuration) + delayTime)
    setDisplayText(currentText)
  }

  function handleSceneProgression() {
    switch (currentTutorialScene) {
      case SceneName.Tutorial:
        dispatchSetScene(SceneName.TutorialScene2)
        break
      case SceneName.TutorialScene2:
        dispatchSetTutorialLevel(DuelTutorialLevel.SIMPLE)
        dispatchSetScene(SceneName.Duel, { duelId: duelIdSimple })
        break
      case SceneName.TutorialScene3:
        dispatchSetTutorialLevel(DuelTutorialLevel.FULL)
        dispatchSetScene(SceneName.Duel, { duelId: duelIdFull })
        break
      case SceneName.TutorialScene5:
        animateTextOpacity(0)
        setShowCardPack(true)
        setTimeout(() => {
          setShowTutorialOverlay(true)
        }, 1000)
        break
    }
  }

  function handleDemonSceneHover() {
    if (itemHovered) {
      animateTextOpacity(1)
    }

    if (itemHovered === 'demon_right') {
      handleDemonRightHover()
    } else if (itemHovered === 'demon_left') {
      handleDemonLeftHover()
    } else {
      (_currentScene as InteractibleScene).hideItem?.(TextureName.bg_demon_person)
    }
  }

  function handleDemonRightHover() {
    if (currentSceneData?.texts[2] === displayText) {
      setTimeout(() => handleAnimationComplete(), 500)
    }
    setDisplayText(currentSceneData?.texts[2])
    ;(_currentScene as InteractibleScene).showItem?.(TextureName.bg_demon_person)
  }

  function handleDemonLeftHover() {
    if (currentSceneData?.texts[1] === displayText) {
      setTimeout(() => handleAnimationComplete(), 500)
    }
    setDisplayText(currentSceneData?.texts[1])
    ;(_currentScene as InteractibleScene).hideItem?.(TextureName.bg_demon_person)
  }

  function handleItemClick() {
    switch (itemClicked) {
      case 'demon_right':
        (_currentScene as InteractibleScene).setClickable?.(false)
        setFlashOpacity(1)
        if (!isLoading && !isError && !isConnecting && connect) {
          connect()
        }
        break
      case 'demon_left':
        disconnect()
        dispatchSetScene(SceneName.Gate)
        break
    }
  }

  function handleTutorialCreation() {
    if (currentTutorialScene === SceneName.TutorialScene2) {
      tutorial.create_tutorial(account, playerId, 1)
    } else if (currentTutorialScene === SceneName.TutorialScene3) {
      tutorial.create_tutorial(account, playerId, 2)
    }
  }

  function handleConnectionSuccess() {
    removeFlash()
    setTimeout(() => {
      dispatchSetScene(SceneName.TutorialScene5)
    }, 500)
    setTimeout(() => {
      (_currentScene as InteractibleScene).setClickable?.(true)
    }, 1000)
  }

  function handleAnimationComplete() {
    if (currentTutorialScene === SceneName.TutorialScene4) {
      animateTextOpacity(0, 2000)
    }
  }

  function handleSkipText() {
    if (!canSkipText) return
    setCanSkipText(false)
    setCurrentTextIndex(prev => prev + 1)
  }

  function animateTextOpacity(targetOpacity: number, delay: number = 0) {
    currentTween.current?.stop()
    currentTween.current = new TWEEN.Tween({ opacity: textOpacityRef.current })
      .to({ opacity: targetOpacity }, 300)
      .delay(delay)
      .onUpdate(({ opacity }) => {
        setTextOpacity(opacity)
        textOpacityRef.current = opacity
      })
      .start()
  }

  function removeFlash() {
    new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, 1000)
      .delay(1000)
      .onUpdate((obj) => setFlashOpacity(obj.opacity))
      .start()
  }

  return (
    <>
      <div className='NoMouse NoDrag' style={{ width: '100%', height: '100%', backgroundColor: 'white', position: 'absolute', top: 0, left: 0, zIndex: 999, opacity: flashOpacity }}></div>
      {currentTutorialScene && currentTutorialScene !== SceneName.TutorialScene4 && (
        <div 
          className="tutorialDialogContainer NoMouse NoDrag"
          style={{
            opacity: textOpacity
          }}
        >
          <div className="tutorialTextBackground" />
          <div className="tutorialContent">
            <div className="speakerName">
              {displayText?.characterName}
            </div>

            <div className="tutorialDivider"/>

            <div className="textContainer">
              <AnimatedText
                text={displayText?.text}
                delayPerCharacter={ANIMATION_TIME_PER_LETTER}
              />
            </div>

            {canSkipText && (
              <div className="indicator">
                ♦
              </div>
            )}

            <div 
              className="nextButton YesMouse"
              onClick={handleSkipText}
            >
              <span className="nextText">Next</span>
              <div className="nextIcon">
                <img className="svg" src="/icons/icon_spacebar.svg" />
              </div>
            </div>
          </div>
        </div>
      )}
      {currentTutorialScene === SceneName.TutorialScene4 && (
        <div className='DemonTalkBaloon NoMouse NoDrag' style={{ opacity: textOpacity }}>
          <AnimatedText text={displayText?.text} delayPerCharacter={ANIMATION_TIME_PER_LETTER} onAnimationComplete={handleAnimationComplete} />
        </div>
      )}

      <DuelTutorialOverlay 
        tutorialType={DuelTutorialLevel.DUELIST_PACKS}
        isOpen={showTutorialOverlay}
        setIsOpen={setShowTutorialOverlay}
        onComplete={() => setCardPackClickable(true)}
      />

      {showCardPack && (
        <div className={!cardPackClickable ? 'NoMouse' : ''}>
          <CardPack isOpen={showCardPack} />
        </div>
      )}
    </>
  )
}

//TODO on click of duelist card, go to duel with it
//TODO add text choose duelist above duelist pack