import React, { useState } from 'react'
import { Container, Grid } from 'semantic-ui-react'
import { BladesIcon, CustomIcon, EmojiIcon, PacesIcon } from '@/pistols/components/ui/Icons'
import App from '@/pistols/components/App'
import { Action } from '@/pistols/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function IndexPage() {
  const [state, setState] = useState(false)
  return (
    <App>
      <Container text>

        <h5>Icons</h5>
        <Grid>
          <Row>
            <Col><PacesIcon paces={10} /></Col>
            <Col><BladesIcon blade={Action.Strong} /></Col>
            <Col><BladesIcon blade={Action.Fast} /></Col>
            <Col><BladesIcon blade={Action.Block} /></Col>
            <Col><EmojiIcon emoji={'😛'} /></Col>
          </Row>
          <Row>
            <Col><CustomIcon name='target' /></Col>
            <Col><CustomIcon name='twitter' logo /></Col>
            <Col><CustomIcon name='twitter' logo color='green' /></Col>
            <Col><CustomIcon name='twitter' logo onClick={() => alert('click')} /></Col>
            <Col><CustomIcon name='volume-off' icon /></Col>
            <Col><CustomIcon name='volume-off' icon color='red' /></Col>
            <Col><CustomIcon name={`volume-${state ? 'on' : 'off'}`} icon onClick={() => setState(!state)} /></Col>
          </Row>

        </Grid>
      </Container>
    </App>
  );
}
