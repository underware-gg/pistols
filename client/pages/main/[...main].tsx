import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useRouterStarter, useRouterListener } from '@/pistols/hooks/useRouterListener'
import { usePistolsContext, SceneName } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import AppPistols from '@/pistols/components/AppPistols'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import GameContainer from '@/pistols/components/GameContainer'
import Background from '@/pistols/components/Background'
import Gate from '@/pistols/components/Gate'
import Tavern from '@/pistols/components/Tavern'
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

//
// Booth config
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
type Repo = {
  playerId: string
}
export const getServerSideProps = (async () => {
  const repo: Repo = {
    playerId: process.env.PLAYER_ID ?? ''
  }
  return { props: { repo } }
}) satisfies GetServerSideProps<{ repo: Repo }>


export default function MainPage({
  repo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter()
  const { menuKey, dispatchSetScene } = usePistolsContext()
  const { playerId } = usePlayerId()

  useEffect(() => {
    console.log((repo.playerId == playerId), playerId, repo)
    if (repo.playerId && playerId && repo.playerId != playerId) {
      router.push('/')
    }
  }, [playerId, repo])

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
        title = 'Pistols - Gate'
        // bgClassName = 'BackgroundGate'
      } else if (_page == 'tavern') {
        scene = SceneName.Tavern
        title = 'Pistols - Tavern'
        // bgClassName = menuKey ? bgsTavern[menuKey] : 'BackgroundDuelists'
      } else if (_page == 'duel') {
        // '/room/[duel_id]'
        if (_slugs.length > 0) {
          scene = SceneName.Duel
          duelId = BigInt(_slugs[0])
          title = 'Pistols - Duel!'
        } else {
          scene = SceneName.Gate
          router.push('/gate')
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

  // console.log(`AT scene [${scene}] menu [${menuKey}]`, atTavern, atDuel, duelId, gameImpl)

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
  const { atGate, atTavern, atDuel, connectOpener } = usePistolsContext()
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
      <StarknetConnectModal opener={connectOpener} />
    </>
  )
}
