import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { _currentScene, SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { SceneName, TextureName } from '/src/data/assets'
import { ANIMATION_TIME_PER_LETTER, DELAY_BETWEEN_TEXTS, DELAY_BETWEEN_SPEECH, TUTORIAL_SCENE_DATA, TutorialScene, TutorialText, DuelTutorialLevel } from '/src/data/tutorialConstants'
import { AUDIO_ASSETS } from '/src/data/audioAssets'
import { useConnectToSelectedNetwork, useDojoStatus, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useTutorialLevel, useTutorialPlayerId } from '/src/hooks/useTutorial'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useGameEvent } from '/src/hooks/useGameEvent'
import AnimatedText, { AnimatedTextHandle } from '/src/components/ui/AnimatedText'
import * as TWEEN from '@tweenjs/tween.js'
import { CardPack } from '/src/components/ui/CardPack'
import DuelTutorialOverlay from '/src/components/ui/duel/DuelTutorialOverlay'
import { CARD_PACK_SIZE, MAX_TILT } from '/src/data/cardConstants'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { useDuelistsOwnedByPlayer } from '/src/hooks/useTokenDuelists'
import { SettingsActions, useSettings } from '/src/hooks/SettingsContext'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTextureShift } from '/src/hooks/useTextureShift'

export default function ScTutorial({ currentTutorialScene }: { currentTutorialScene: string }) {
  // Scene & Context
  const { dispatchSetting } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { tutorialOpener, dispatchSetTutorialLevel } = usePistolsContext()
  
  // Game Events
  const { value: itemHovered } = useGameEvent('hover_item', null)
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { x: demonShiftX, y: demonShiftY } = useTextureShift(2)

  // Web3 Hooks
  const { isConnecting } = useAccount()
  const { isLoading, isError } = useDojoStatus()
  const { disconnect } = useDisconnect()
  const { account } = useAccount()
  const { connect } = useConnectToSelectedNetwork(handleConnectionSuccess)
  const { tutorial } = useDojoSystemCalls()

  // CardPack Data
  const { duelistIds } = useDuelistsOwnedByPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)


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
  const [showCardPack, setShowCardPack] = useState(false)
  const [cardPackClickable, setCardPackClickable] = useState(false)
  const [hasSkippedScene, setHasSkippedScene] = useState(false)
  const [skipProgress, setSkipProgress] = useState(0)
  const [isHoldingSkip, setIsHoldingSkip] = useState(false)
  const [skipSource, setSkipSource] = useState<'mouse' | 'keyboard' | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSkipReady, setIsSkipReady] = useState(true)
  const textOpacityRef = useRef(0)
  const currentTween = useRef<TWEEN.Tween<any> | null>(null)
  const skipTween = useRef<TWEEN.Tween<any> | null>(null)
  const animatedTextRef = useRef<AnimatedTextHandle>(null)
  const currentTutorialSceneRef = useRef<string>(currentTutorialScene)


  // Scene Initialization & Cleanup
  
  // Scene Initialization & Cleanup
  useEffect(() => {
    if (!currentTutorialScene) return
    currentTutorialSceneRef.current = currentTutorialScene
    
    initializeScene()

    return () => {
      // Reset all state when component unmounts
      setCurrentSceneData(undefined)
      setCurrentTextIndex(0)
      setCanSkipText(false)
      setDisplayText(undefined) 
      setTextOpacity(0)
      textOpacityRef.current = 0
      setShowCardPack(false)
      setCardPackClickable(false)
      currentTween.current?.stop()
      currentTween.current = null
      skipTween.current?.stop()
      skipTween.current = null
      setHasSkippedScene(false)
      setSkipSource(null)
      setIsTransitioning(false)
    }
  }, [currentTutorialScene])

  // Text Animation & Progression
  useEffect(() => {
    if (currentTextIndex < 0) return
    if (currentTextIndex == currentSceneData?.texts.length) {
      handleSceneProgression()
      return
    }

    handleTextDisplay()
  }, [currentTextIndex])

  useEffect(() => {
    if (currentTutorialScene === SceneName.TutorialScene2 && !duelIdSimple) {
      setIsSkipReady(false)
    } else if (currentTutorialScene === SceneName.TutorialScene3 && !duelIdFull) {
      setIsSkipReady(false)
    } else {
      setIsSkipReady(true)
    }
  }, [currentTutorialScene, duelIdFull, duelIdSimple])

  // Text Animation Timers
  useEffect(() => {
    if (textDuration <= 0) return
    if (hasSkippedScene) return

    const skipTimeout = setTimeout(() => setCanSkipText(true), textDuration * 0.8)
    const nextTextTimeout = setTimeout(() => {
      setCanSkipText(false)
      setCurrentTextIndex(prev => prev + 1)
    }, totalDuration)

    return () => {
      clearTimeout(skipTimeout)
      clearTimeout(nextTextTimeout)
    }
  }, [totalDuration, textDuration, hasSkippedScene])

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') handleSkipText()
      
      if (event.code === 'Escape') {
        startSkipProgress('keyboard')
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        stopSkipProgress('keyboard')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [canSkipText, isHoldingSkip])

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

  const mounted = useMounted()
  const [createdTutorialSimple, setCreatedTutorialSimple] = useState(false)
  const [createdTutorialFull, setCreatedTutorialFull] = useState(false)
  useEffect(() => {
    if (mounted) {
      if (currentTutorialScene === SceneName.TutorialScene2 && duelIdSimple && !createdTutorialSimple) {
        tutorial.create_tutorial(account, playerId, 1)
        setCreatedTutorialSimple(true)
      } else if (currentTutorialScene === SceneName.TutorialScene3 && duelIdFull && !createdTutorialFull) {
        tutorial.create_tutorial(account, playerId, 2)
        setCreatedTutorialFull(true)
      }
    }
  }, [currentTutorialScene, duelIdSimple, duelIdFull, createdTutorialSimple, createdTutorialFull])

  function goToRealDuel(duelistId?: number) {
    //TODO create challenge against bot with matchmaking and navigatge there with a selected duelist 
    dispatchSetting(SettingsActions.TUTORIAL_LEVEL, 3)
    dispatchSetScene(SceneName.Tavern)
  }

  // Helper Functions
  function initializeScene() {
    setCurrentTextIndex(-1)
    setDisplayText(undefined)
    setCurrentSceneData(TUTORIAL_SCENE_DATA[currentTutorialScene])
    setIsTransitioning(false)

    setTimeout(() => setCurrentTextIndex(0), SCENE_CHANGE_ANIMATION_DURATION * 1.5)
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
    setIsTransitioning(true)
    switch (currentTutorialSceneRef.current) {
      case SceneName.Tutorial:
        dispatchSetScene(SceneName.TutorialScene2)
        break
      case SceneName.TutorialScene2:
        dispatchSetTutorialLevel(DuelTutorialLevel.SIMPLE)
        dispatchSetScene(SceneName.TutorialDuel, { duelId: duelIdSimple })
        break
      case SceneName.TutorialScene3:
        dispatchSetTutorialLevel(DuelTutorialLevel.FULL)
        dispatchSetScene(SceneName.TutorialDuel, { duelId: duelIdFull })
        break
      case SceneName.TutorialScene5:
        if (canClaimStarterPack) {
          animateTextOpacity(0)
          setShowCardPack(true)
          setTimeout(() => {
            tutorialOpener.open()
          }, 1000)
        } else {
          goToRealDuel()
        }
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
      ;(_currentScene as InteractibleScene)?.hideItem?.(TextureName.bg_demon_victim)
      ;(_currentScene as InteractibleScene)?.hideItem?.(TextureName.bg_demon_background)
    }
  }

  function handleDemonRightHover() {
    if (currentSceneData?.texts[2] === displayText) {
      setTimeout(() => handleAnimationComplete(), 500)
    }
    setDisplayText(currentSceneData?.texts[2])
    ;(_currentScene as InteractibleScene)?.showItem?.(TextureName.bg_demon_victim)
    ;(_currentScene as InteractibleScene)?.showItem?.(TextureName.bg_demon_background)
  }

  function handleDemonLeftHover() {
    if (currentSceneData?.texts[1] === displayText) {
      setTimeout(() => handleAnimationComplete(), 500)
    }
    setDisplayText(currentSceneData?.texts[1])
    ;(_currentScene as InteractibleScene)?.hideItem?.(TextureName.bg_demon_victim)
    ;(_currentScene as InteractibleScene)?.hideItem?.(TextureName.bg_demon_background)
  }

  function handleItemClick() {
    switch (itemClicked) {
      case 'demon_right':
        (_currentScene as InteractibleScene)?.setClickable?.(false)
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

  function handleConnectionSuccess() {
    removeFlash()
    setTimeout(() => {
      dispatchSetScene(SceneName.TutorialScene5)
    }, 500)
    setTimeout(() => {
      (_currentScene as InteractibleScene)?.setClickable?.(true)
    }, 1000)
  }

  function handleAnimationComplete() {
    if (currentTutorialScene === SceneName.TutorialScene4) {
      animateTextOpacity(0, 2000)
    }
  }

  function handleSkipText() {
    if (!canSkipText) {
      if (animatedTextRef.current) {
        animatedTextRef.current.skipAnimation()
        
        setCanSkipText(true)
      }
    } else {
      setCanSkipText(false)
      setCurrentTextIndex(prev => prev + 1)
    }
  }

  function startSkipProgress(source: 'mouse' | 'keyboard') {
    if (isHoldingSkip || isTransitioning) return
    if (skipSource !== null && skipSource !== source) return
    
    setIsHoldingSkip(true)
    setSkipSource(source)
    
    skipTween.current?.stop()
    skipTween.current = new TWEEN.Tween({ progress: 0 })
      .to({ progress: 1 }, 1000)
      .easing(TWEEN.Easing.Circular.Out)
      .onUpdate(({ progress }) => {
        setSkipProgress(progress)
      })
      .onComplete(() => {
        setIsHoldingSkip(false)
        setSkipProgress(0)
        setSkipSource(null)
        setHasSkippedScene(true)
        handleSceneProgression()
      })
      .start()
  }
  
  function stopSkipProgress(source: 'mouse' | 'keyboard') {
    if (!isHoldingSkip) return
    if (skipSource !== source) return
    
    setIsHoldingSkip(false)
    setSkipSource(null)
    
    skipTween.current?.stop()
    skipTween.current = new TWEEN.Tween({ progress: skipProgress })
      .to({ progress: 0 }, 200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({ progress }) => {
        setSkipProgress(progress)
      })
      .start()
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
                ref={animatedTextRef}
                text={displayText?.text}
                delayPerCharacter={ANIMATION_TIME_PER_LETTER}
                containerClassName="tutorial-text-wrapper"
              />
            </div>

            {canSkipText && !isTransitioning && (
              <div className="indicator">
                ♦
              </div>
            )}
            
            <div className="tutorialButtonsContainer">
              <div 
                className="nextButton YesMouse"
                onClick={handleSkipText}
                style={{ opacity: isTransitioning ? 0.5 : 1, pointerEvents: isTransitioning ? 'none' : 'auto' }}
              >
                <span className="nextText">Next</span>
                <div className="nextIcon">
                  <img className="svg" src="/icons/icon_spacebar.svg" />
                </div>
              </div>

              <div 
                className="nextButton YesMouse"
                onMouseDown={() => isSkipReady && startSkipProgress('mouse')}
                onMouseUp={() => isSkipReady && stopSkipProgress('mouse')}
                onMouseLeave={() => isSkipReady && stopSkipProgress('mouse')}
                style={{ opacity: isTransitioning || !isSkipReady ? 0.5 : 1, pointerEvents: isTransitioning || !isSkipReady ? 'none' : 'auto' }}
              >
                <span className="nextText">Skip</span>
                <div className="nextIcon" style={{ position: 'relative', overflow: 'visible' }}>
                  <div>Esc</div>
                  <svg width="200%" height="200%" viewBox="0 0 36 36" style={{ position: 'absolute', top: '-50%', left: '-50%' }}>
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      stroke="#fff" 
                      strokeWidth="4" 
                      strokeDasharray={`${skipProgress * 100} 100`}
                      transform="rotate(0 18 18)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {currentTutorialScene === SceneName.TutorialScene4 && (
        <div className='DemonTalkBaloon NoMouse NoDrag' style={{ opacity: textOpacity, transform: `translate(${demonShiftX}px, ${demonShiftY}px)` }}>
          <AnimatedText 
            text={displayText?.text} 
            delayPerCharacter={ANIMATION_TIME_PER_LETTER} 
            onAnimationComplete={handleAnimationComplete} 
            containerClassName="demon-text-wrapper"
          />
        </div>
      )}

      <DuelTutorialOverlay 
        tutorialType={DuelTutorialLevel.DUELIST_PACKS}
        opener={tutorialOpener}
        onComplete={() => setCardPackClickable(true)}
      />

      <CardPack 
        packType={constants.PackType.StarterPack} 
        isOpen={showCardPack} 
        clickable={cardPackClickable} 
        cardPackSize={CARD_PACK_SIZE} 
        maxTilt={MAX_TILT} 
        onComplete={(selectedDuelistId) => goToRealDuel(selectedDuelistId)} 
        optionalTitle="Choose your Duelist:" />
    </>
  )
}

//TODO on click of duelist card, go to duel with it