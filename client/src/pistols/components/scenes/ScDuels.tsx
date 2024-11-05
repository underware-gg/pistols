import React, { useEffect, useMemo } from 'react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'
import TableModal from '@/pistols/components/modals/TableModal'

export default function ScDuels() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { value: newScene, timestamp } = useGameEvent('change_scene', null)
  useEffect(() => {
    if (newScene) {
      dispatchSetScene(newScene)
    }
  }, [newScene, timestamp])

  return (
    <div>

    </div>
  )
}
