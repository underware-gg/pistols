import React, { useMemo, useState } from 'react'
import { Container, Grid, Menu } from 'semantic-ui-react'
import { usePistolsContext, menuItems } from '@/pistols/hooks/PistolsContext'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import DuelistList from '@/pistols/components/DuelistList'
import DuelistModal from '@/pistols/components/DuelistModal'
import { ChallengeList } from '@/pistols/components/ChallengeList'
import ChallengeModal from '@/pistols/components/ChallengeModal'

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
        <h2>of Honorable Lords 👑</h2>
      </div>

      <Container text className=''>
        {atDuels && <ChallengeList />}
        {atDuelists && <DuelistList />}
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