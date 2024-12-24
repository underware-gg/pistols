import React, { useEffect, useMemo, useState } from 'react'
import { useRouterStarter, useRouterListener } from '@/hooks/useRouterListener'
import { usePistolsContext, usePistolsScene, usePistolsSceneRoute } from '@/hooks/PistolsContext'
import { useThreeJsContext } from '@/hooks/ThreeJsContext'
import { DojoStatus, useDojoStatus } from '@underware_gg/pistols-sdk/dojo'
import { usePlayerId } from '@underware_gg/pistols-sdk/hooks'
import { MouseToolTip } from '@/components/ui/MouseToolTip'
import { Header } from '@/components/Header'
import { SCENE_CHANGE_ANIMATION_DURATION } from '@/three/game'
import AppPistols from '@/components/AppPistols'
import GameContainer from '@/components/GameContainer'
import Background from '@/components/Background'
import PlayerModal from '@/components/modals/PlayerModal'
import DuelistModal from '@/components/modals/DuelistModal'
import ChallengeModal from '@/components/modals/ChallengeModal'
import NewChallengeModal from '@/components/modals/NewChallengeModal'
import WalletFinderModal from '@/components/modals/WalletFinderModal'
import ActivityPanel from '@/components/ActivityPanel'
import ScProfile from '@/components/scenes/ScProfile'
import ScTavern from '@/components/scenes/ScTavern'
import ScDuels from '@/components/scenes/ScDuels'
import ScDuelists from '@/components/scenes/ScDuelists'
import ScGraveyard from '@/components/scenes/ScGraveyard'
import ScTutorial from '@/components/scenes/ScTutorial'
import StoreSync from '@/stores/sync/StoreSync'
import Gate from '@/components/scenes/ScGate'
import Door from '@/components/scenes/ScDoor'
import Duel from '@/components/scenes/Duel'

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
