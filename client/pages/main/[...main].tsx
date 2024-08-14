import React from 'react'
import { useRouterStarter, useRouterListener } from '@/pistols/hooks/useRouterListener'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import AppPistols from '@/pistols/components/AppPistols'
import GameContainer from '@/pistols/components/GameContainer'
import Background from '@/pistols/components/Background'
import GateProfile from '@/pistols/components/GateProfile'
import Tavern from '@/pistols/components/Tavern'
import Duel from '@/pistols/components/Duel'
import Gate from '@/pistols/components/Gate'

// // enable wasm in build (this is for api routes and server issues)
// export const config = {
//   runtime: 'experimental-edge'
// }

export default function MainPage() {
  // let's initialzie player id always, it is a random client identifier
  const { playerId } = usePlayerId()
  // this hook will parse slugs and ser the current scene
  const { currentScene, sceneTitle } = usePistolsScene(true)

  // console.log(`AT scene [${currentScene}]`)

  return (
    <AppPistols headerData={{ title: sceneTitle }} backgroundImage={null}>
      <Background className={null}>
        <GameContainer isVisible={true} />
        <MainUI />
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
  const { atGate, atProfile, atTavern, atDuel, currentScene } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

  // wait for three.js to load
  if (!gameImpl) return <></>

  // wait for Dojo to load
  if (!isInitialized) return <DojoStatus message={'Loading Pistols...'} />

  // load Game Scene
  if (atGate) return <Gate />
  if (atProfile) return <GateProfile />
  if (atTavern) return <Tavern />
  if (atDuel && selectedDuelId) return <Duel duelId={selectedDuelId} />

  // ????
  console.warn(`UNKNOWN SCENE [${currentScene}]`)
  return <Tavern />
}
