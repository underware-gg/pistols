import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
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

export default function MainPage() {
  const router = useRouter()

  const { page, title, duelId, className } = useMemo(() => {
    let page = null
    let title = null
    let duelId = null
    let className = null

    // parse page
    if (router.isReady && router.query.main) {
      const _page = router.query.main[0]
      const _slugs = router.query.main.slice(1)
      if (_page == 'gate') {
        page = _page
        title = 'Pistols - The Gate'
        className = 'BackgroundWeapons'
      } else if (_page == 'tavern') {
        page = _page
        title = 'Pistols - The Tavern'
        className = 'BackgroundWeapons'
      } else if (_page == 'duel') {
        // '/room/[duel_id]'
        if (_slugs.length > 0) {
          page = _page
          duelId = BigInt(_slugs[0])
          title = 'Pistols - Duel!'
        } else {
          page = 'tavern'
          router.push('/tavern')
        }
        // className = 'BackgroundDuel'
      }
    }
    return {
      page,
      title,
      duelId,
      className,
    }
  }, [router.isReady, router.query])

  if (!page) {
    if (router.isReady) {
      // invalid route
      router.push('/')
    }
    // return <></> // causes hydration error
  }

  const _atGate = (page == 'gate')
  const _atTavern = (page == 'tavern')
  const _atDuel = (page == 'duel')

  return (
    <AppDojo title={title} backgroundImage={null}>
      <Background className={className}>
        <GameContainer
          isPlaying={_atDuel}
          duelId={duelId}
        />
        {_atGate && <Gate />}
        {_atTavern && <Tavern />}
        {_atDuel && <Duel duelId={duelId}/>}
      </Background>
    </AppDojo>
  );
}
