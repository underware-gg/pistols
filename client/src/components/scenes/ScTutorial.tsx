import React, { useEffect, useState } from 'react'
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

export default function ScTutorial({ currentTutorialScene }: { currentTutorialScene: string }) {
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSetTutorialLevel } = usePistolsContext()
  const { value: itemHovered } = useGameEvent('hover_item', null)
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  const { isConnecting } = useSelectedChain()
  const { isLoading, isError } = useDojoStatus()
  const { disconnect } = useDisconnect()
  const { connect } = useConnectToSelectedChain(() => {
    removeFlash()
    setTimeout(() => {
      dispatchSetScene(SceneName.TutorialScene5)
    }, 500)
    setTimeout(() => {
      (_currentScene as InteractibleScene).setClickable?.(true);
    }, 1000)
  })

  const { account } = useAccount()
  const { duelId: duelIdSimple } = useTutorialLevel(1)
  const { duelId: duelIdFull } = useTutorialLevel(2)
  const { tutorial } = useDojoSystemCalls()
  const { playerId } = useTutorialPlayerId()
  
  const [currentSceneData, setCurrentSceneData] = useState<TutorialScene>()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [canSkipText, setCanSkipText] = useState(false)
  
  const [displayText, setDisplayText] = useState<TutorialText>()
  const [totalDuration, setTotalDuration] = useState<number>(0)
  const [textDuration, setTextDuration] = useState<number>(0)

  const [flashOpacity, setFlashOpacity] = useState(0)
  const [textOpacity, setTextOpacity] = useState(1)
  const [currentTween, setCurrentTween] = useState<TWEEN.Tween<any> | null>(null)

  useEffect(() => {
    if (!currentTutorialScene) return
    setCurrentTextIndex(-1);
    setCurrentSceneData(TUTORIAL_SCENE_DATA[currentTutorialScene]);
    (_currentScene as InteractibleScene).setSceneData(currentTutorialScene);

    if (currentTutorialScene === SceneName.TutorialScene4) {
      (_currentScene as InteractibleScene).hideItemInstantly?.(TextureName.bg_demon_person);
      setTextOpacity(1); // Reset text opacity when scene changes
    }
  }, [currentTutorialScene])

  useEffect(() => {
    setCurrentTextIndex(0)
    //TODO play sfx audios with delays
  }, [currentSceneData])

  useEffect(() => {
    if (currentTutorialScene === SceneName.TutorialScene4) {
      if (itemHovered) {
        currentTween?.stop();
        if (currentTextIndex > 0) {
          const targetOpacity = itemHovered ? 1 : 0;
          const tween = new TWEEN.Tween({ opacity: textOpacity })
            .to({ opacity: targetOpacity }, 300)
            .onUpdate((obj) => setTextOpacity(obj.opacity))
            .start()
          
          setCurrentTween(tween);
        }

        if (itemHovered == 'demon_right') {
          setDisplayText(currentSceneData?.texts[2]);
          (_currentScene as InteractibleScene).showItem?.(TextureName.bg_demon_person);
        } else if (itemHovered == 'demon_left') {
          setDisplayText(currentSceneData?.texts[1]);
          (_currentScene as InteractibleScene).hideItem?.(TextureName.bg_demon_person);
        } else {
          (_currentScene as InteractibleScene).hideItem?.(TextureName.bg_demon_person);
        }
      } else {
        (_currentScene as InteractibleScene).hideItem?.(TextureName.bg_demon_person);
      }
    }
  }, [itemHovered, currentTutorialScene, currentTextIndex])

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'demon_right':
          (_currentScene as InteractibleScene).setClickable?.(false);
          flash()
          _connect()
          break
        case 'demon_left':
          //TODO if logged in go to tavern else go to gate?
          disconnect()
          dispatchSetScene(SceneName.Gate)
          break
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (currentTutorialScene === SceneName.TutorialScene2) {
      tutorial.create_tutorial(account, playerId, 1)
    } else if (currentTutorialScene === SceneName.TutorialScene3) {
      tutorial.create_tutorial(account, playerId, 2)
    }
  }, [currentTutorialScene, duelIdSimple, duelIdFull])

  useEffect(() => {
    if (currentTextIndex >= currentSceneData?.texts.length) {
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
        // case SceneName.TutorialScene4:
        //   dispatchSetScene(SceneName.TutorialScene5)
        //   break
      }
    }
  }, [currentTextIndex, currentTutorialScene, duelIdSimple, duelIdFull])

  useEffect(() => {
    if (currentTextIndex < 0) return

    if (currentTextIndex < currentSceneData?.texts.length) {
      const currentText = currentSceneData?.texts[currentTextIndex]
    
      if (!currentText) return
      if (currentTutorialScene === SceneName.TutorialScene4 && currentTextIndex > 0) return

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

  const canConnect = (!isLoading && !isError && !isConnecting && connect != null)

  const _connect = () => {
    if (canConnect) {
      connect()
    }
  }

  const handleAnimationComplete = () => {
    if (currentTutorialScene === SceneName.TutorialScene4) {
      currentTween?.stop();
      const tween = new TWEEN.Tween({ opacity: 1 })
        .to({ opacity: 0 }, 300)
        .delay(2000)
        .onUpdate((obj) => setTextOpacity(obj.opacity))
        .start()
      
      setCurrentTween(tween);
    }
  }

  const handleSkipText = () => {
    if (!canSkipText) return

    clearTimeout(skipTimeout)
    clearTimeout(nextTextTimeout)
    setCanSkipText(false)
    setCurrentTextIndex(prev => prev + 1)
  }

  const flash = () => {
    setFlashOpacity(1)
  }

  const removeFlash = () => {
    new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, 1000)
      .delay(1000)
      .onUpdate((obj) => {
        setFlashOpacity(obj.opacity)
      })
      .start()
  }

  return (
    <>
      <div className='NoMouse NoDrag' style={{ width: '100%', height: '100%', backgroundColor: 'white', position: 'absolute', top: 0, left: 0, zIndex: 999, opacity: flashOpacity }}></div>
      {currentTutorialScene !== SceneName.TutorialScene4 && (
        <div className="tutorialDialogContainer NoMouse NoDrag" >
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
              onAnimationComplete={handleAnimationComplete}
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

      {currentTutorialScene === SceneName.TutorialScene5 && currentTextIndex >= (currentSceneData?.texts.length || 0) && (
        <CardPack />
      )}
      
    </>
  )
}
