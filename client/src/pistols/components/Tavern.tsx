import React, { useMemo, useState } from 'react'
import { Container, Grid, Menu } from 'semantic-ui-react'
import { usePistolsContext, menuItems } from '@/pistols/hooks/PistolsContext'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import { ChallengeTableMain } from '@/pistols/components/ChallengeTable'
import { DuelistTableMain } from '@/pistols/components/DuelistTable'
import ChallengeModal from '@/pistols/components/ChallengeModal'
import DuelistModal from '@/pistols/components/DuelistModal'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const { menuItem, atDuels, atDuelists } = usePistolsContext()

  return (
    <>
      <TavernMenu selectedItem={menuItem} />
      {/* <AccountHeader /> */}

      <div className='TavernTitle AlignCenter'>
        <h1>The Tavern</h1>
        <h2>of Honourable Lords 👑</h2>
      </div>

      <Container text className=''>
        {atDuels && <ChallengeTableMain />}
        {atDuelists && <DuelistTableMain />}
        <DuelistModal />
        <ChallengeModal />
      </Container>
    </>
  )
}

function TavernMenu({
  selectedItem,
}) {
  const { dispatchSetMenuItem } = usePistolsContext()

  const items = useMemo(() => {
    let result = []
    Object.values(menuItems).forEach(item => {
      result.push(
        <Menu.Item
          key={item}
          name={item}
          active={selectedItem === item}
          onClick={() => dispatchSetMenuItem(item)}
        />
      )
    })
    return result
  }, [selectedItem])

  return (
    <Menu secondary className='TavernMenu' size='huge'>
      {items}

      <Menu.Menu position='right'>
        <AccountHeader />
      </Menu.Menu>

    </Menu>
  )
}