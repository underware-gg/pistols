import React, { useEffect, useMemo, useState } from 'react'
import { useRouterStarter, useRouterListener } from '@/pistols/hooks/useRouterListener'
import { usePistolsContext, usePistolsScene, usePistolsSceneRoute } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import AppPistols from '@/pistols/components/AppPistols'
import GameContainer from '@/pistols/components/GameContainer'
import Background from '@/pistols/components/Background'
import ScProfile from '@/pistols/components/scenes/ScProfile'
import ScTavern from '@/pistols/components/scenes/ScTavern'
import Gate from '@/pistols/components/scenes/ScGate'
import Door from '@/pistols/components/scenes/ScDoor'
import Duel from '@/pistols/components/scenes/Duel'
import { MouseToolTip } from '@/pistols/components/ui/MouseToolTip'
import { Header } from '@/pistols/components/Header'
import { SCENE_CHANGE_ANIMATION_DURATION } from '@/pistols/three/game'

// // enable wasm in build (this is for api routes and server issues)
// export const config = {
//   runtime: 'experimental-edge'
// }

export default function MainPage() {
  // let's initialzie player id always, it is a random client identifier
  const { playerId } = usePlayerId()
  // this hook will parse slugs and manage the current scene
  usePistolsSceneRoute()
  const { sceneTitle } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

  const overlay = useMemo(() => <div id="game-black-overlay" className='NoMouse NoDrag' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', opacity: 1, pointerEvents: 'none' }}></div>, [])

  // console.log(`AT scene [${currentScene}]`)

  return (
    <AppPistols headerData={{ title: sceneTitle }} backgroundImage={null}>
      <Background className={null}>
        <GameContainer isVisible={true} />
        <MainUI /> {/* Make it so this shows the correct scene and each scene has just the controlls for that one */}
        {overlay}
        { isInitialized && <Header /> }
        <MouseToolTip/>
        {/* ADD NOTRIFICATIONS - how to make them into a hook? */}
      </Background>
    </AppPistols>
  )
}

function MainUI({
}) {
  useRouterStarter()
  useRouterListener()
  const { gameImpl } = useThreeJsContext()
  const { selectedDuelId } = usePistolsContext()
  const { atGate, atProfile, atTavern, atDuel, atDoor } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

  const [currentScene, setCurrentScene] = useState<JSX.Element | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (atGate) setCurrentScene(<Gate />);
      else if (atDoor) setCurrentScene(<Door />);
      else if (atDuel && selectedDuelId) setCurrentScene(<Duel duelId={selectedDuelId} />);
      else if (atProfile) setCurrentScene(<ScProfile />);
      else setCurrentScene(<ScTavern />);
    }, SCENE_CHANGE_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [atGate, atDoor, atDuel, atProfile, atTavern, selectedDuelId]);

  if (!gameImpl) return <></>

  if (!isInitialized) return <DojoStatus message={'Loading Pistols...'} />

  return currentScene || <DojoStatus message={'Loading Pistols...'} />;
}
