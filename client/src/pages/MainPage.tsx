import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { usePistolsContext, usePistolsScene, usePistolsSceneFromRoute, useSyncRouterParams } from '/src/hooks/PistolsContext'
import { useSetPageTitle } from '/src/hooks/useSetPageTitle'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { DojoStatus } from '@underware/pistols-sdk/dojo'
import { MouseToolTip } from '/src/components/ui/MouseToolTip'
import { Header } from '/src/components/Header'
import * as ENV from '/src/utils/env'
import * as TWEEN from '@tweenjs/tween.js'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
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
import StoreSync from '/src/stores/sync/StoreSync'
import Gate from '/src/components/scenes/ScGate'
import Door from '/src/components/scenes/ScDoor'
import Duel from '/src/components/scenes/Duel'
import ScLeaderboards from '/src/components/scenes/ScLeaderboards'

// test sdk
import { helloPistols } from '@underware/pistols-sdk'
import { useQuality } from '../hooks/useQuality'
import ScCardPacks from '../components/scenes/ScCardPacks'
import ScDuelistBook from '../components/scenes/ScDuelistBook'
import { PlayerDuelistsProvider } from '../components/PlayerDuelistsOrganized'

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
        <PlayerDuelistsProvider>
          <GameContainer isVisible={true} />
          <MainUI />
          <Modals />
          {overlay}
          <Header />
          <CurrentChainHint />
          <MouseToolTip />
          <TavernAudios />
        </PlayerDuelistsProvider>
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
    </>
  )
}
