import React from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { MenuTavern } from '@/pistols/components/Menus'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { AccountChangeDetector, ChainChangeDetector } from '@/lib/dojo/ChangeDetector'
import PlayerSwitcher from '@/pistols/components/PlayerSwitcher'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const router = useRouter()

  const _back = () => {
    router.push('/gate')
  }

  return (
    <>
      <div className='UIContainerTavern'>
        <MenuTavern />
      </div>

      <PlayerSwitcher />

      <DuelistModal />
      <ChallengeModal />
      <TavernAudios />

      <AccountChangeDetector onChange={_back} />
      <ChainChangeDetector onChange={_back} />
    </>
  )
}
