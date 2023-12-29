import React from 'react'
import { Container, Grid } from 'semantic-ui-react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import { MenuTavern } from '@/pistols/components/Menus'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const { atDuelists, atYourDuels, atLiveDuels, atPastDuels } = usePistolsContext()
  return (
    <>
      <MenuTavern />
      {/* <AccountHeader /> */}

      <div className='TavernTitle'>
        <h1>The Tavern</h1>
        <h2>of Honourable Lords 👑</h2>
      </div>

      <Container text className=''>
        <div className='TableMain'>
          {atDuelists && <DuelistTable />}
          {atYourDuels && <ChallengeTableYour />}
          {atLiveDuels && <ChallengeTableLive />}
          {atPastDuels && <ChallengeTablePast />}
        </div>
        <DuelistModal />
        <ChallengeModal />
      </Container>
    </>
  )
}
