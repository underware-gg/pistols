import React from 'react'
import { Grid } from 'semantic-ui-react'
import { MenuTavern } from '@/pistols/components/Menus'
import { TavernAudios } from '@/pistols/components/GameContainer'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {

  return (
    <>
      <div className='UIContainerTavern'>
        <MenuTavern />
      </div>

      <DuelistModal />
      <ChallengeModal />
      <TavernAudios />
    </>
  )
}
