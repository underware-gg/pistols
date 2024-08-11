import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useRouterStarter, useRouterListener } from '@/pistols/hooks/useRouterListener'
import { usePistolsContext, SceneName } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import AppPistols from '@/pistols/components/AppPistols'
import GameContainer from '@/pistols/components/GameContainer'
import Background from '@/pistols/components/Background'
import Tavern from '@/pistols/components/Tavern'
import Duel from '@/pistols/components/Duel'
import Gate from '@/pistols/components/Gate'

// // enable wasm in build (this is for api routes and server issues)
// export const config = {
//   runtime: 'experimental-edge'
// }

export default function MainPage() {
  const router = useRouter()
  const { menuKey, dispatchSetScene } = usePistolsContext()
  const { playerId } = usePlayerId()

  const { scene, title, duelId, bgClassName } = useMemo(() => {
    let scene = undefined
    let title = null
    let duelId = null
    let bgClassName = null

    // parse page
    if (router.isReady && router.query.main) {
      const _page = router.query.main[0]
      const _slugs = router.query.main.slice(1)
      if (_page == 'gate') {
        scene = SceneName.Gate
        title = 'Pistols at 10 Blocks'
      } else if (_page == 'tavern') {
        scene = SceneName.Tavern
        title = 'Pistols - Tavern'
      } else if (_page == 'duel') {
        // '/room/[duel_id]'
        if (_slugs.length > 0) {
          scene = SceneName.Duel
          duelId = BigInt(_slugs[0])
          title = 'Pistols - Duel!'
        } else {
          router.push('/')
        }
        // bgClassName = 'BackgroundDuel'
      }
    }
    return {
      scene,
      title,
      duelId,
      bgClassName,
    }
  }, [router.isReady, router.query, menuKey])

  useEffect(() => {
    if (scene !== undefined) {
      dispatchSetScene(scene)
    }
    else if (router.isReady) {
      // invalid route
      router.push('/')
    }
  }, [scene, router.isReady])

  // console.log(`AT scene [${scene}] menu [${menuKey}]`)

  return (
    <AppPistols headerData={{ title }} backgroundImage={null}>
      <Background className={bgClassName}>
        <GameContainer
          isVisible={true}
          duelId={duelId}
        />
        <MainUI duelId={duelId} />
      </Background>
    </AppPistols>
  )
}

function MainUI({
  duelId
}) {
  useRouterStarter()
  useRouterListener()
  const { gameImpl } = useThreeJsContext()
  const { atGate, atTavern, atDuel } = usePistolsContext()
  const { isInitialized } = useDojoStatus()

  if (!gameImpl) {
    return <></>
  }

  if (!isInitialized) {
    return <DojoStatus message={'Loading Pistols...'} />
  }

  return (
    <>
      {atGate && <Gate />}
      {atTavern && <Tavern />}
      {atDuel && duelId && <Duel duelId={duelId} />}
    </>
  )
}
