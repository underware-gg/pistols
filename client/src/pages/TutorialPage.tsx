import React, { useEffect, useMemo, useState } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { usePistolsScene, usePistolsSceneFromRoute } from '/src/hooks/PistolsContext'
import { useSetPageTitle } from '/src/hooks/useSetPageTitle'
import { TUTORIAL_CHAIN_ID } from '@underware_gg/pistols-sdk/dojo'
import { useEffectOnce, usePlayerId } from '@underware_gg/pistols-sdk/utils'
import { MouseToolTip } from '/src/components/ui/MouseToolTip'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppGame from '/src/components/AppGame'
import GameContainer from '/src/components/GameContainer'
import Background from '/src/components/Background'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import ScTutorial from '/src/components/scenes/ScTutorial'
import StoreSync from '/src/stores/sync/StoreSync'

export default function TutorialPage() {
  // tutorials use playerId to id the players
  usePlayerId()

  // this hook will parse slugs and manage the current scene
  usePistolsSceneFromRoute()
  useSetPageTitle()

  const overlay = useMemo(() => <div id="game-black-overlay" className='NoMouse NoDrag' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', opacity: 1, pointerEvents: 'none', zIndex: 5 }}></div>, [])

  useEffectOnce(() => console.log(`---------------- MAIN PAGE MOUNTED`), [])

  return (
    <AppGame backgroundImage={null} chainId={TUTORIAL_CHAIN_ID} autoConnect>
      <Background className={null}>
        <StoreSync />
        <GameContainer isVisible={true} />
        <TutorialUI />
        <ChallengeModal />
        {overlay}
        <CurrentChainHint />
        <MouseToolTip />
      </Background>
    </AppGame>
  )
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
