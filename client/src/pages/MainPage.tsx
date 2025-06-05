import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { usePistolsContext, usePistolsScene, usePistolsSceneFromRoute, useSyncRouterParams } from '/src/hooks/PistolsContext'
import { useSetPageTitle } from '/src/hooks/useSetPageTitle'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { useQuality } from '/src/hooks/useQuality'
import { DojoStatus, emitter } from '@underware/pistols-sdk/dojo'
import { MouseToolTip } from '/src/components/ui/MouseToolTip'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import * as ENV from '/src/utils/env'
import * as TWEEN from '@tweenjs/tween.js'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppGame from '/src/components/AppGame'
import GameContainer, { TavernAudios } from '/src/components/GameContainer'
import Background from '/src/components/Background'
import PlayerModal from '/src/components/modals/PlayerModal'
import DuelistModal from '/src/components/modals/DuelistModal'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import NewChallengeModal from '/src/components/modals/NewChallengeModal'
import SelectDuelistModal from '/src/components/modals/SelectDuelistModal'
import WalletFinderModal from '/src/components/modals/WalletFinderModal'
import SettingsModal from '/src/components/modals/SettingsModal'
import ScProfile from '/src/components/scenes/ScProfile'
import ScTavern from '/src/components/scenes/ScTavern'
import ScDuelsBoard from '/src/components/scenes/ScDuelsBoard'
import ScDuelists from '/src/components/scenes/ScDuelists'
import ScGraveyard from '/src/components/scenes/ScGraveyard'
import ScTutorial from '/src/components/scenes/ScTutorial'
import ScCardPacks from '/src/components/scenes/ScCardPacks'
import ScDuelistBook from '/src/components/scenes/ScDuelistBook'
import StoreSync from '/src/stores/sync/StoreSync'
import ScLeaderboards from '/src/components/scenes/ScLeaderboards'
import Gate from '/src/components/scenes/ScGate'
import Door from '/src/components/scenes/ScDoor'
import Duel from '/src/components/scenes/Duel'
import { Header } from '/src/components/Header'
import NotificationSystem from '/src/components/notifications/NotificationSystem'
import { NotificationProvider } from '/src/stores/notificationStore'

// test sdk
import { helloPistols } from '@underware/pistols-sdk'
import { BackButton } from '../components/ui/Buttons'
import { CustomIcon } from '../components/ui/Icons'
import { useGameAspect } from '../hooks/useGameAspect'

helloPistols();
export default function MainPage({
  tutorial = false,
}) {
  // this hook will parse slugs and manage the current scene
  usePistolsSceneFromRoute()
  useSetPageTitle()

  const [showTutorial, setShowTutorial] = useState(tutorial)
  const overlayRef = useRef<HTMLDivElement>(null)

  const overlay = useMemo(() => (
    <div 
      ref={overlayRef}
      id="game-black-overlay" 
      className='NoMouse NoDrag' 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'black', 
        opacity: 1, 
        pointerEvents: 'none', 
        zIndex: 981 
      }}
    />
  ), [])

  useEffect(() => {
    if (tutorial !== showTutorial) {
      // Fade to black
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1 }, SCENE_CHANGE_ANIMATION_DURATION)
        .onUpdate(({opacity}) => {
          if (overlayRef.current) {
            overlayRef.current.style.opacity = opacity.toString()
          }
        })
        .onComplete(() => {
          setShowTutorial(tutorial)
        })
        .start()
    }
  }, [tutorial])
  
  useEffectOnce(() => console.log(`---------------- MAIN PAGE MOUNTED`), [])

  return (
    <AppGame backgroundImage={null} networkId={showTutorial ? ENV.ACADEMY_NETWORK_ID : undefined} autoConnect={showTutorial}>
        <Background className={null}>
          <NotificationProvider>
            <GameContainer isVisible={true} />
            <MainUI />
            <Modals />
            {overlay}
            <Header />
            <CurrentChainHint />
            <MouseToolTip />
            <TavernAudios />
            <NotificationSystem />
          </NotificationProvider>
        </Background>
      </AppGame>
  );
}

function MainUI() {
  // sync game context with url params
  useSyncRouterParams()

  const { gameImpl } = useThreeJsContext()
  const { qualityConfig } = useQuality()
  const { currentDuel, tutorialLevel } = usePistolsContext()
  const { atGate, atProfile, atTavern, atDuel, atDoor, atDuelsBoard, atDuelists, atGraveyard, atTutorial, atLeaderboards, atCardPacks, atDuelistBook } = usePistolsScene()

  useEffect(() => {
    if (!gameImpl) return;
    
    // Apply each quality setting
    gameImpl.updateShadows(
      qualityConfig.shadowMapEnabled,
      qualityConfig.shadowMapType,
      qualityConfig.shadowMapSize
    );
    
    gameImpl.updateResolution(qualityConfig.resolutionScale);
    
    gameImpl.updateGrass(
      qualityConfig.grassCount,
      qualityConfig.grassSegments
    );
    
    gameImpl.updateWater(
      qualityConfig.reflectionsEnabled,
      qualityConfig.reflectionQuality,
      qualityConfig.waterEffects
    );
    
    gameImpl.updateParticles(qualityConfig.particlesMultiplier);
    
    gameImpl.updateInteractibeSceneSettings(
      qualityConfig.sceneShiftEnabled,
      qualityConfig.blurEnabled
    );
  }, [gameImpl, qualityConfig]);

  const [currentScene, setCurrentScene] = useState<JSX.Element | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (atGate) setCurrentScene(<Gate />);
      else if (atDoor) setCurrentScene(<Door />);
      else if (atDuel && currentDuel > 0n) setCurrentScene(<Duel duelId={currentDuel} tutorial={tutorialLevel} />);
      else if (atTutorial) setCurrentScene(<TutorialUI />);
      else if (atProfile) setCurrentScene(<ScProfile />);
      else if (atCardPacks) setCurrentScene(<ScCardPacks />);
      else if (atDuelistBook) setCurrentScene(<ScDuelistBook />);
      else if (atDuelsBoard) setCurrentScene(<ScDuelsBoard />);
      else if (atDuelists) setCurrentScene(<ScDuelists />);
      else if (atGraveyard) setCurrentScene(<ScGraveyard />);
      else if (atLeaderboards) setCurrentScene(<ScLeaderboards />);
      else setCurrentScene(<ScTavern />);
    }, SCENE_CHANGE_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [atGate, atDoor, atDuel, atProfile, atTavern, atDuelsBoard, atDuelists, atGraveyard, atLeaderboards, atCardPacks, atDuelistBook, currentDuel, tutorialLevel]);

  if (!gameImpl) return <></>

  return (
    <>
      {(Boolean(currentScene) && !atGate) && <StoreSync />}
      {currentScene || <DojoStatus message={'Loading Scene...'} />}
    </>
  )
}

function TutorialUI({
}) {
  const { gameImpl } = useThreeJsContext()
  const { atTutorial, currentScene, wasLastSceneTutorial } = usePistolsScene()

  const [currentTutorialScene, setCurrentTutorialScene] = useState<string>("");

  useEffect(() => {
    let timer
    if (!wasLastSceneTutorial && atTutorial) {
      timer = setTimeout(() => {
        setCurrentTutorialScene(currentScene);
      }, SCENE_CHANGE_ANIMATION_DURATION / 5);
    } else if (atTutorial && wasLastSceneTutorial) {
      timer = setTimeout(() => {
        setCurrentTutorialScene(currentScene);
      }, SCENE_CHANGE_ANIMATION_DURATION);
    }
    
    return () => clearTimeout(timer);
  }, [atTutorial, currentScene]);

  if (!gameImpl) return <></>

  return <ScTutorial currentTutorialScene={currentTutorialScene} />;
}

function Modals() {
  const { walletFinderOpener, duelistSelectOpener, settingsOpener } = usePistolsContext()

  return (
    <>
      <ChallengeModal />
      <DuelistModal />
      <PlayerModal />
      <NewChallengeModal />
      <SelectDuelistModal opener={duelistSelectOpener} />
      <WalletFinderModal opener={walletFinderOpener} />
      <SettingsModal opener={settingsOpener} />
      <ModalNavigator />
    </>
  )
}

function ModalNavigator() {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { hasSelectionHistory, dispatchPopSelection, dispatchClearSelectionHistory } = usePistolsContext()

  useEffect(() => {
    emitter.emit('hover_description', null)
  }, [hasSelectionHistory])

  if (!hasSelectionHistory) return <></>

  return (
    <div 
      className='NoMouse NoDrag' 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: aspectWidth(100), 
        height: aspectHeight(10), 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'top', 
        zIndex: 1001,
        paddingTop: aspectWidth(1),
        paddingLeft: aspectWidth(2),
        paddingBottom: aspectWidth(2)
      }}
    >
      <CustomIcon icon png raw 
        name={'back_arrow'} 
        onClick={() => dispatchPopSelection()} 
        tooltip='Navigate Back'
        size={'huge'} 
        disabled={false} 
      />
      <CustomIcon icon png raw 
        name={'close'} 
        onClick={() => dispatchClearSelectionHistory()} 
        tooltip='Clear All'
        size={'huge'} 
        disabled={false} 
      />
    </div>
  )
}