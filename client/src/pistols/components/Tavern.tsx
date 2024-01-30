import React from 'react'
import { Grid } from 'semantic-ui-react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { MenuSettings, MenuTavern } from '@/pistols/components/Menus'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import { TavernAudios } from '@/pistols/components/GameContainer'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const { atDuelists, atYourDuels, atLiveDuels, atPastDuels } = usePistolsContext()
  return (
    <>
      <MenuTavern />
      <MenuSettings />
      {/* <AccountHeader /> */}

      <div className='TableMain'>
        {atDuelists && <DuelistTable />}
        {atYourDuels && <ChallengeTableYour />}
        {atLiveDuels && <ChallengeTableLive />}
        {atPastDuels && <ChallengeTablePast />}
      </div>

      <DuelistModal />
      <ChallengeModal />
      <TavernAudios />
    </>
  )
}
