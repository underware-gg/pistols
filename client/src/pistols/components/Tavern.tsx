import React from 'react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { TavernMenu } from '@/pistols/components/TavernMenu'
import { ConnectionDetector, DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import TableModal from '@/pistols/components/TableModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import NewChallengeModal from '@/pistols/components/NewChallengeModal'
import { useTestValidateSignature } from '../hooks/useContractCalls'

export default function Tavern() {
  const { tableOpener } = usePistolsContext()
  useTestValidateSignature()

  return (
    <QueryProvider>
      <div className='UIContainerTavern'>
        <TavernMenu />
      </div>

      <TableModal opener={tableOpener} />
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />

      <DojoSetupErrorDetector />
      <ConnectionDetector />
    </QueryProvider>
  )
}
