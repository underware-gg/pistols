import React, { useEffect, useMemo, useState } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { usePistolsContext, usePistolsScene, usePistolsSceneFromRoute, useSyncRouterParams } from '/src/hooks/PistolsContext'
import { useSyncSelectedDuelist } from '/src/hooks/useSyncDuelist'
import { useSetPageTitle } from '/src/hooks/useSetPageTitle'
import { DojoStatus, useDojoStatus } from '@underware_gg/pistols-sdk/dojo'
import { useEffectOnce, usePlayerId } from '@underware_gg/pistols-sdk/utils'
import { MouseToolTip } from '/src/components/ui/MouseToolTip'
import { Header } from '/src/components/Header'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppGame from '/src/components/AppGame'
import GameContainer from '/src/components/GameContainer'
import Background from '/src/components/Background'
import PlayerModal from '/src/components/modals/PlayerModal'
import DuelistModal from '/src/components/modals/DuelistModal'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import NewChallengeModal from '/src/components/modals/NewChallengeModal'
import WalletFinderModal from '/src/components/modals/WalletFinderModal'
import ActivityPanel from '/src/components/ActivityPanel'
import ScProfile from '/src/components/scenes/ScProfile'
import ScTavern from '/src/components/scenes/ScTavern'
import ScDuels from '/src/components/scenes/ScDuels'
import ScDuelists from '/src/components/scenes/ScDuelists'
import ScGraveyard from '/src/components/scenes/ScGraveyard'
import ScTutorial from '/src/components/scenes/ScTutorial'
import StoreSync from '/src/stores/sync/StoreSync'
import Gate from '/src/components/scenes/ScGate'
import Door from '/src/components/scenes/ScDoor'
import Duel from '/src/components/scenes/Duel'

// test sdk
import { helloPistols } from '@underware_gg/pistols-sdk'
helloPistols();

export default function MainPage() {
  // let's initialize player id always
  // (random client identifier, useful for off-chain tracking)
  const { playerId } = usePlayerId()

  // this hook will parse slugs and manage the current scene
  usePistolsSceneFromRoute()
  useSetPageTitle()

  const overlay = useMemo(() => <div id="game-black-overlay" className='NoMouse NoDrag' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', opacity: 1, pointerEvents: 'none', zIndex: 5 }}></div>, [])

  useEffectOnce(() => console.log(`---------------- MAIN PAGE MOUNTED`), [])

  return (
    <AppGame backgroundImage={null}>
      <Background className={null}>
        <StoreSync />
        <GameContainer isVisible={true} />
        <MainUI />
        <Modals />
        {overlay}
        <ActivityPanel />
        <Header />
        <CurrentChainHint />
        <MouseToolTip />
      </Background>
    </AppGame>
  )
}

function MainUI() {
  // sync game context with url params
  useSyncRouterParams()

  // switch duelist after wallet change
  useSyncSelectedDuelist()

  const { gameImpl } = useThreeJsContext()
  const { selectedDuelId } = usePistolsContext()
  const { atGate, atProfile, atTavern, atDuel, atDoor, atDuels, atDuelists, atGraveyard, atTutorial } = usePistolsScene()

  const [currentScene, setCurrentScene] = useState<JSX.Element | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (atGate) setCurrentScene(<Gate />);
      else if (atDoor) setCurrentScene(<Door />);
      else if (atTutorial) setCurrentScene(<TutorialUI />);
      else if (atDuel && selectedDuelId) setCurrentScene(<Duel duelId={selectedDuelId} />);
      else if (atProfile) setCurrentScene(<ScProfile />);
      else if (atDuels) setCurrentScene(<ScDuels />);
      else if (atDuelists) setCurrentScene(<ScDuelists />);
      else if (atGraveyard) setCurrentScene(<ScGraveyard />);
      else setCurrentScene(<ScTavern />);
    }, SCENE_CHANGE_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [atGate, atDoor, atTutorial, atDuel, selectedDuelId, atProfile, atDuels, atDuelists, atGraveyard, atTavern]);

  if (!gameImpl) return <></>

  return currentScene || <DojoStatus message={'Loading Pistols...'} />;
}

function TutorialUI({
}) {
  const { gameImpl } = useThreeJsContext()
  const { atTutorial, currentScene } = usePistolsScene()

  const [currentTutorialScene, setCurrentTutorialScene] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (atTutorial) {
        setCurrentTutorialScene(currentScene);
      }
    }, SCENE_CHANGE_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [atTutorial, currentScene]);

  if (!gameImpl) return <></>

  return <ScTutorial currentTutorialScene={currentTutorialScene} />;
}


function Modals() {
  const { selectedDuelId, selectedDuelistId, selectedPlayerAddress, challengingAddress, walletFinderOpener } = usePistolsContext()
  const challengeIsOpen = useMemo(() => (selectedDuelId > 0), [selectedDuelId])
  const duelistIsOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])
  const playerIsOpen = useMemo(() => (selectedPlayerAddress > 0n), [selectedPlayerAddress])
  const newChallengeIsOpen = useMemo(() => (challengingAddress > 0n), [challengingAddress])
  return (
    <>
      {challengeIsOpen && <ChallengeModal />}
      {duelistIsOpen && <DuelistModal />}
      {playerIsOpen && <PlayerModal />}
      {newChallengeIsOpen && <NewChallengeModal />}
      <WalletFinderModal opener={walletFinderOpener} />
    </>
  )
}
