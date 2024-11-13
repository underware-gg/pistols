import React from 'react'
import { useRouterStarter, useRouterListener } from '@/pistols/hooks/useRouterListener'
import { usePistolsContext, usePistolsScene, usePistolsSceneRoute } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import AppPistols from '@/pistols/components/AppPistols'
import GameContainer from '@/pistols/components/GameContainer'
import Background from '@/pistols/components/Background'
import ScProfile from '@/pistols/components/ScProfile'
import ScTavern from '@/pistols/components/ScTavern'
import Gate from '@/pistols/components/ScGate'
import Duel from '@/pistols/components/Duel'

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
  const { atGate, atProfile, atTavern, atDuel } = usePistolsScene()
  const { isInitialized } = useDojoStatus()

  // wait for three.js to load
  if (!gameImpl) return <></>

  // wait for Dojo to load
  if (!isInitialized) return <DojoStatus message={'Loading Pistols...'} />

  // standalone scenes
  if (atGate) return <Gate />
  if (atDuel && selectedDuelId) return <Duel duelId={selectedDuelId} />
  if (atProfile) return <ScProfile />

  // Tavern
  return <ScTavern />
}
