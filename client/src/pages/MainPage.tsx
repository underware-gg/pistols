import React, { useEffect, useMemo, useState } from 'react'
import { useRouterStarter, useRouterListener } from '/src/hooks/useRouterListener'
import { usePistolsContext, usePistolsScene, usePistolsSceneRoute } from '/src/hooks/PistolsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { DojoStatus, useDojoStatus } from '@underware_gg/pistols-sdk/dojo'
import { usePlayerId } from '@underware_gg/pistols-sdk/hooks'
import { MouseToolTip } from '/src/components/ui/MouseToolTip'
import { Header } from '/src/components/Header'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import AppPistols from '/src/components/AppPistols'
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
  // let's initialzie player id always, it is a random client identifier
  const { playerId } = usePlayerId()
  // this hook will parse slugs and manage the current scene
  usePistolsSceneRoute()
  const { sceneTitle } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

  const overlay = useMemo(() => <div id="game-black-overlay" className='NoMouse NoDrag' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', opacity: 1, pointerEvents: 'none', zIndex: 5 }}></div>, [])

  // console.log(`AT scene [${currentScene}]`)

  return (
    <AppPistols backgroundImage={null}>
      <Background className={null}>
        {isInitialized &&
          <>
            <StoreSync />
            <GameContainer isVisible={true} />
            <MainUI />
            <Modals />
            {overlay}
            <ActivityPanel />
            <Header />
          </>
        }
        <MouseToolTip />
      </Background>
    </AppPistols>
  )
}

function MainUI() {
  useRouterStarter()
  useRouterListener()
  const { gameImpl } = useThreeJsContext()
  const { selectedDuelId } = usePistolsContext()
  const { atGate, atProfile, atTavern, atDuel, atDoor, atDuels, atDuelists, atGraveyard, atTutorial } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

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
  }, [atGate, atDoor, atDuel, atProfile, atTavern, atDuels, atDuelists, atGraveyard]);

  if (!gameImpl) return <></>

  if (!isInitialized) return <DojoStatus message={'Loading Pistols...'} />

  return currentScene || <DojoStatus message={'Loading Pistols...'} />;
}

function TutorialUI({
}) {
  useRouterStarter()
  useRouterListener()
  const { gameImpl } = useThreeJsContext()
  const { atTutorial, currentScene } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

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

  if (!isInitialized) return <DojoStatus message={'Loading Pistols...'} />

  return <ScTutorial currentTutorialScene={currentTutorialScene} />;
}


function Modals() {
  const { selectedDuelId, selectedDuelistId, selectedPlayerAddress, challengingId, walletFinderOpener } = usePistolsContext()
  const challengeIsOpen = useMemo(() => (selectedDuelId > 0), [selectedDuelId])
  const duelistIsOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])
  const playerIsOpen = useMemo(() => (selectedPlayerAddress > 0n), [selectedPlayerAddress])
  const newChallengeIsOpen = useMemo(() => (challengingId > 0n), [challengingId])
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
