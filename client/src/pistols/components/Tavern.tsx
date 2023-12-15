import React from 'react'
import { Container, Grid, Image } from 'semantic-ui-react'
import AccountCurrent from './AccountCurrent'

const Row = Grid.Row
const Col = Grid.Column

function Tavern() {
  return (
    <Container>

      <div className='AlignCenter'>
        {/* <Image className='ManorImage' src='/images/manor.jpg' /> */}
        <h1>The Tavern</h1>
        {/* <h2>The Lair of the Slender Duck!</h2> */}
      </div>
      <br />

      <Container text className='Faded Padded'>
        <AccountCurrent />
      </Container>
      <br />

      <Container text className='Faded'>
        <p>Challenge other players</p>
      </Container>

    </Container>
  )
}

export default Tavern
