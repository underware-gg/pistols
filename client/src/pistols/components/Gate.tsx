import React from 'react'
import { Container, Grid } from 'semantic-ui-react'
import { AccountsList } from '@/pistols/components/account/AccountsList'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  return (
    <>
      <div className='AlignCenter'>
        <h1>Identify yourself!</h1>
      </div>
      <br />
      <Container text>
        <br />
        <AccountsList />
        <br />
      </Container>
      <br />
    </>
  )
}
