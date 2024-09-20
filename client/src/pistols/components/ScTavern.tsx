import React from 'react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { TavernHeader, TavernMenu } from '@/pistols/components/TavernMenu'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import TableModal from '@/pistols/components/TableModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import NewChallengeModal from '@/pistols/components/NewChallengeModal'

export default function ScTavern() {
  const { tableOpener } = usePistolsContext()
  // useTestValidateSignature()

  return (
    <QueryProvider>

      <TavernHeader />
      <TavernMenu />

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
