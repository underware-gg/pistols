import React, { useMemo, useState } from 'react'
import { Container, Grid, Menu } from 'semantic-ui-react'
import AccountHeader from './account/AccountHeader'
import { DuelistList } from './DuelistList'
import { menuItems, usePistolsContext } from '../hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column

export default function Tavern() {
  const { menuItem } = usePistolsContext()

  return (
    <>
      <TavernMenu selectedItem={menuItem} />
      {/* <AccountHeader /> */}

      <div className='TavernTitle AlignCenter'>
        <h1>The Tavern</h1>
        <h2>of Honorable Lords 👑</h2>
      </div>

      <Container>

        <Container text className=''>
          <DuelistList />
        </Container>

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
    menuItems.forEach(item => {
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