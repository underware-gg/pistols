import React from 'react'
import { Container, Divider, Grid } from 'semantic-ui-react'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import Logo from './Logo'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  return (
    <div className='UIContainer'>

      <Grid className='FillWidth'>
        <Row colums='equal'>
          <Col>
            <Logo />
          </Col>
        </Row>

        <Row colums='equal' textAlign='center' className='TitleCase'>
          <Col>
            <h1>Pistols at Ten Blocks</h1>
          </Col>
        </Row>

        <Row>
          <Col>
            <hr />
          </Col>
        </Row>

        <Row colums='equal' className='Title'>
          <Col>
            Who wants in?
          </Col>
        </Row>
      </Grid>

      <AccountsList />
      
    </div>
  )
}
