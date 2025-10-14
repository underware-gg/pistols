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
import InviteModal from '/src/components/modals/InviteModal'
import DuelistModal from '/src/components/modals/DuelistModal'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import NewChallengeModal from '/src/components/modals/NewChallengeModal'
import SelectDuelistModal from '/src/components/modals/SelectDuelistModal'
import WalletFinderModal from '/src/components/modals/WalletFinderModal'
import SettingsModal from '/src/components/modals/SettingsModal'
import ModeSelectModal from '/src/components/modals/ModeSelectModal'
import BugReportModal from '/src/components/modals/BugReportModal'
import ScProfile from '/src/components/scenes/ScProfile'
import ScTavern from '/src/components/scenes/ScTavern'
import ScDuelsBoard from '/src/components/scenes/ScDuelsBoard'
import ScDuelists from '/src/components/scenes/ScDuelists'
import ScMatchmaking from '/src/components/scenes/ScMatchmaking'
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
import { useQueueBackgroundWorker } from '/src/hooks/useQueueBackgroundWorker'

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

  // Global background queue worker
  useQueueBackgroundWorker()

  const { gameImpl } = useThreeJsContext()
  const { qualityConfig } = useQuality()
  const { currentDuel, tutorialLevel } = usePistolsContext()
  const { atGate, atProfile, atInvite, atTavern, atDuel, atDoor, atDuelsBoard, atDuelists, atGraveyard, atTutorial, atLeaderboards, atCardPacks, atDuelistBook, atMatchmaking } = usePistolsScene()

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
  
  // Memoize scene components to prevent unnecessary re-renders
  const sceneComponents = useMemo(() => ({
    gate: <ScGate />,
    door: <ScDoor />,
    profile: <ScProfile />,
    cardPacks: <ScCardPacks />,
    duelistBook: <ScDuelistBook />,
    duelsBoard: <ScDuelsBoard />,
    duelists: <ScDuelists />,
    matchmaking: <ScMatchmaking />,
    graveyard: <ScGraveyard />,
    leaderboards: <ScLeaderboards />,
    tavern: <ScTavern />,
    tutorial: <TutorialUI />,
    invite: <></>,
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (atGate) setCurrentScene(sceneComponents.gate);
      else if (atDoor) setCurrentScene(sceneComponents.door);
      else if (atDuel && currentDuel > 0n) setCurrentScene(<Duel duelId={currentDuel} tutorial={tutorialLevel} />);
      else if (atTutorial) setCurrentScene(sceneComponents.tutorial);
      else if (atProfile) setCurrentScene(sceneComponents.profile);
      else if (atCardPacks) setCurrentScene(sceneComponents.cardPacks);
      else if (atDuelistBook) setCurrentScene(sceneComponents.duelistBook);
      else if (atDuelsBoard) setCurrentScene(sceneComponents.duelsBoard);
      else if (atDuelists) setCurrentScene(sceneComponents.duelists);
      else if (atMatchmaking) setCurrentScene(sceneComponents.matchmaking);
      else if (atGraveyard) setCurrentScene(sceneComponents.graveyard);
      else if (atLeaderboards) setCurrentScene(sceneComponents.leaderboards);
      else if (atInvite) setCurrentScene(sceneComponents.invite);
      else setCurrentScene(sceneComponents.tavern);
    }, SCENE_CHANGE_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [atGate, atDoor, atDuel, atProfile, atTavern, atDuelsBoard, atDuelists, atMatchmaking, atGraveyard, atLeaderboards, atCardPacks, atDuelistBook, currentDuel, tutorialLevel, sceneComponents]);

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
  const { walletFinderOpener, duelistSelectOpener, settingsOpener, bugReportOpener, tavernRingsOpener, modeSelectOpener } = usePistolsContext()

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
      <InviteModal />
      <NewChallengeModal />
      <BugReportModal opener={bugReportOpener} />
      <SelectDuelistModal opener={duelistSelectOpener} />
      <WalletFinderModal opener={walletFinderOpener} />
      <SettingsModal opener={settingsOpener} />
      <ModeSelectModal opener={modeSelectOpener} />
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