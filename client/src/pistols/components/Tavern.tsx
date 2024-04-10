import React from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { MenuTavern } from '@/pistols/components/Menus'
import { TavernAudios } from '@/pistols/components/GameContainer'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import { AccountChangeDetector, ChainChangeDetector } from '@/lib/dojo/ChangeDetector'

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

      <DuelistModal />
      <ChallengeModal />
      <TavernAudios />

      <AccountChangeDetector onChange={_back} />
      <ChainChangeDetector onChange={_back} />
    </>
  )
}
