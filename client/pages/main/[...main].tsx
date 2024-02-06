import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { usePistolsContext, MenuKey, Scene } from '@/pistols/hooks/PistolsContext'
import AppDojo from '@/pistols/components/AppDojo'
import Gate from '@/pistols/components/Gate'
import Tavern from '@/pistols/components/Tavern'
import GameContainer from '@/pistols/components/GameContainer'
import Background from '@/pistols/components/Background'
import Duel from '@/pistols/components/Duel'

// enable wasm in build (this is for api routes)
// export const config = {
//   runtime: 'experimental-edge'
// }

// const bgsTavern: Record<MenuKey, string | null> = {
//   [MenuKey.Duelists]: null,//'BackgroundDuelists',
//   [MenuKey.YourDuels]: null,//'BackgroundDuelsYour',
//   [MenuKey.LiveDuels]: null,//'BackgroundDuelsLive',
//   [MenuKey.PastDuels]: null,//'BackgroundDuelsPast',
// }

export default function MainPage() {
  const router = useRouter()
  const { menuKey, scene: currentScene, atGate, atTavern, atDuel, dispatchSetScene } = usePistolsContext()

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
        scene = Scene.Gate
        title = 'Pistols - The Gate'
        // bgClassName = 'BackgroundGate'
      } else if (_page == 'tavern') {
        scene = Scene.Tavern
        title = 'Pistols - The Tavern'
        // bgClassName = menuKey ? bgsTavern[menuKey] : 'BackgroundDuelists'
      } else if (_page == 'duel') {
        // '/room/[duel_id]'
        if (_slugs.length > 0) {
          scene = Scene.Duel
          duelId = BigInt(_slugs[0])
          title = 'Pistols - Duel!'
        } else {
          scene = Scene.Tavern
          router.push('/tavern')
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

  // console.log(`AT scene [${currentScene}] menu [${menuKey}]`, atTavern, atDuel, duelId, router.query.main)

  return (
    <AppDojo title={title} backgroundImage={null}>
      <Background className={bgClassName}>
        <GameContainer
          isVisible={atDuel && duelId}
        />
        {atGate && <Gate />}
        {atTavern && <Tavern />}
        {atDuel && duelId && <Duel duelId={duelId} />}
      </Background>
    </AppDojo>
  );
}
