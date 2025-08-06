import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { usePistolsContext, usePistolsScene, usePistolsSceneFromRoute, useSyncRouterParams } from '/src/hooks/PistolsContext'
import { useSetPageTitle } from '/src/hooks/useSetPageTitle'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { useQuality } from '/src/hooks/useQuality'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useCheckPendingTransactions } from '/src/stores/transactionStore'
import { DojoStatus, emitter } from '@underware/pistols-sdk/dojo'
import { MouseToolTip } from '/src/components/ui/MouseToolTip'
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
import BugReportModal from '/src/components/modals/BugReportModal'
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
import ScGate from '/src/components/scenes/ScGate'
import ScDoor, { TutorialPromptModal } from '/src/components/scenes/ScDoor'
import Duel from '/src/components/scenes/Duel'
import { Header } from '/src/components/Header'
import { CustomIcon } from '/src/components/ui/Icons'
import { NotificationProvider } from '/src/stores/notificationStore'
import NotificationSystem from '/src/components/notifications/NotificationSystem'
import ElementPopupNotification, { ElementPopupNotificationRef } from '/src/components/ui/ElementPopupNotification'

// test sdk
import { helloPistols } from '@underware/pistols-sdk'
helloPistols();

export default function MainPage() {
  // this hook will parse slugs and manage the current scene
  usePistolsSceneFromRoute()
  useSetPageTitle()

  const overlayRef = useRef<HTMLDivElement>(null)
  const globalNotificationRef = useRef<ElementPopupNotificationRef>(null)

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

  // Listen for global notification events
  useEffect(() => {
    const handleShowNotification = ({ targetRef, text, icon }: { targetRef: React.RefObject<HTMLElement>, text: string, icon?: string }) => {
      globalNotificationRef.current?.show(targetRef, text, icon)
    }

    emitter.on('show_notification', handleShowNotification)
    return () => emitter.off('show_notification', handleShowNotification)
  }, [])

  useEffectOnce(() => console.log(`---------------- MAIN PAGE MOUNTED`), [])

  return (
    <AppGame backgroundImage={null} networkId={undefined} autoConnect={false}>
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
          <ElementPopupNotification ref={globalNotificationRef} />
        </NotificationProvider>
      </Background>
    </AppGame>
  );
}

function MainUI() {
  // sync game context with url params
  useSyncRouterParams()
  useCheckPendingTransactions()

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
      if (atGate) setCurrentScene(<ScGate />);
      else if (atDoor) setCurrentScene(<ScDoor />);
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
  const { walletFinderOpener, duelistSelectOpener, settingsOpener, bugReportOpener, tavernRingsOpener } = usePistolsContext()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+B or Cmd+B to open bug report
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        bugReportOpener.open()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <>
      <ChallengeModal />
      <DuelistModal />
      <PlayerModal />
      <NewChallengeModal />
      <BugReportModal opener={bugReportOpener} />
      <SelectDuelistModal opener={duelistSelectOpener} />
      <WalletFinderModal opener={walletFinderOpener} />
      <SettingsModal opener={settingsOpener} />
      <TutorialPromptModal />
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
        paddingRight: aspectWidth(2)
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