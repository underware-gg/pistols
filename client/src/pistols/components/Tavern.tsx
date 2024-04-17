import React from 'react'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { MenuTavern } from '@/pistols/components/Menus'
import PlayerSwitcher from '@/pistols/components/PlayerSwitcher'
import ConnectionDetector from './account/ConnectionDetector'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'

export default function Tavern() {
  return (
    <>
      <div className='UIContainerTavern'>
        <MenuTavern />
      </div>

      <PlayerSwitcher />

      <DuelistModal />
      <ChallengeModal />
      <TavernAudios />

      <ConnectionDetector />
    </>
  )
}
