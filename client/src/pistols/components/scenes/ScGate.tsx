import React, { useEffect, useMemo } from 'react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'
import TableModal from '@/pistols/components/modals/TableModal'

export default function ScGate() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'door':
          dispatchSetScene(SceneName.Door)
          break
        case 'duel':
          //TODO navigate to tutorial
          break
        case 'sign':
          //TODO navigate to pistols website
          break
      }
    }
  }, [itemClicked, timestamp])

  return (
    <QueryProvider>

      {/* <TavernMenu /> */}

      <TableModal opener={tableOpener} />
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />
      {/* <BarkeepModal /> */}

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </QueryProvider>
  )
}
