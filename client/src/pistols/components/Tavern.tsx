import React from 'react'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { TavernMenu } from '@/pistols/components/TavernMenu'
import PlayerSwitcher from '@/pistols/components/PlayerSwitcher'
import ConnectionDetector from './account/ConnectionDetector'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'

export default function Tavern() {
  return (
    <>
      <div className='UIContainerTavern'>
        <TavernMenu />
      </div>

      <PlayerSwitcher />

      <DuelistModal />
      <ChallengeModal />
      <TavernAudios />

      <ConnectionDetector />
    </>
  )
}
