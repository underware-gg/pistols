import React, { useEffect, useMemo } from 'react'
import { Label } from 'semantic-ui-react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { TavernMenu } from '@/pistols/components/TavernMenu'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import NewChallengeModal from '@/pistols/components/NewChallengeModal'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import BarkeepModal from '@/pistols/components/BarkeepModal'
import TableModal from '@/pistols/components/TableModal'
import { MenuLabels } from '@/pistols/utils/pistols'
import { Header } from '@/pistols/components/Header'
import { MouseToolTip } from './ui/MouseToolTip'

export default function ScTavern() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { value: newScene, timestamp } = useGameEvent('change_scene', null)
  useEffect(() => {
    if (newScene) {
      dispatchSetScene(newScene)
    }
  }, [newScene, timestamp])

  return (
    <QueryProvider>

      <TavernMenu />
      <Header />

      <TableModal opener={tableOpener} />
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />
      <BarkeepModal />

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </QueryProvider>
  )
}
