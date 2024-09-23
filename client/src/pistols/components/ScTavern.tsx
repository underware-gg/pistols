import React, { useEffect } from 'react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { TavernMenu } from '@/pistols/components/TavernMenu'
import { Header } from '@/pistols/components/Header'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import TableModal from '@/pistols/components/TableModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import NewChallengeModal from '@/pistols/components/NewChallengeModal'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'

export default function ScTavern() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const new_scene = useGameEvent('change_scene', null)
  useEffect(() => {
    if (new_scene) {
      dispatchSetScene(new_scene)
    }
  }, [new_scene])

  return (
    <QueryProvider>

      <TavernMenu />
      <Header />

      <TableModal opener={tableOpener} />
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </QueryProvider>
  )
}
