import React from 'react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { TavernMenu } from '@/pistols/components/TavernMenu'
import DuelInfoSwitcher from '@/pistols/components/DuelInfoSwitcher'
import ConnectionDetector from '@/pistols/components/account/ConnectionDetector'
import TableModal from '@/pistols/components/TableModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import NewChallengeModal from '@/pistols/components/NewChallengeModal'

export default function Tavern() {
  const { tableOpener } = usePistolsContext()

  return (
    <>
      <div className='UIContainerTavern'>
        <TavernMenu />
      </div>

      <DuelInfoSwitcher />

      <TableModal opener={tableOpener} />
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />

      <ConnectionDetector />
    </>
  )
}
