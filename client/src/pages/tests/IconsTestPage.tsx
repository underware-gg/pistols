import React, { useState } from 'react'
import { Container, Grid, Icon } from 'semantic-ui-react'
import { CustomIcon, EmojiIcon } from '/src/components/ui/Icons'
import { ArchetypeIcon, BladesIcon, PacesIcon } from '/src/components/ui/PistolsIcon'
import { LordsBagIcon } from '/src/components/account/Balance'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import App from '/src/components/App'

const Row = Grid.Row
const Col = Grid.Column

export default function IconsTestPage() {
  const [state, setState] = useState(false)
  return (
    <App>
      <Container text>
        <TestPageMenu />

        <h5>Icons</h5>
        <Grid celled>
          <Row columns={'equal'}>
            <Col><PacesIcon paces={constants.PacesCard.Paces10} /><br />PacesIcon</Col>
            <Col><BladesIcon blade={constants.BladesCard.None} /><br />BladesIcon</Col>
            <Col><BladesIcon blade={constants.BladesCard.Seppuku} /><br />BladesIcon</Col>
            <Col><BladesIcon blade={constants.BladesCard.PocketPistol} /><br />BladesIcon</Col>
            <Col><BladesIcon blade={constants.BladesCard.Behead} /><br />BladesIcon</Col>
            <Col><BladesIcon blade={constants.BladesCard.Grapple} /><br />BladesIcon</Col>
            <Col><ArchetypeIcon villainous /><br />ArchetypeIcon</Col>
            <Col><ArchetypeIcon trickster /><br />ArchetypeIcon</Col>
            <Col><ArchetypeIcon honourable /><br />ArchetypeIcon</Col>
          </Row>

          <Row columns={'equal'}>
            <Col><CustomIcon name='home' /><br />Custom fallback</Col>
            <Col><CustomIcon name='twitter' logo /><br />Logo default</Col>
            <Col><CustomIcon name='twitter' logo color='green' /><br />Logo color</Col>
            <Col><CustomIcon name='twitter' logo onClick={() => alert('click')} /><br />Logo onClick</Col>
            <Col><CustomIcon name={`volume-${state ? 'on' : 'off'}`} icon onClick={() => setState(!state)} /><br />Logo state</Col>
            <Col><EmojiIcon emoji={'😛'} /><br />EmojiIcon</Col>
          </Row>

          <Row columns={'equal'}>
            <Col>
              <Icon name='home' size='mini' />
              <Icon name='home' size='tiny' />
              <Icon name='home' size='small' />
              <Icon name='home' />
              <Icon name='home' size='large' />
              <Icon name='home' size='big' />
              <Icon name='home' size='huge' />
              <Icon name='home' size='massive' />
            </Col>
          </Row>

          <Row columns={'equal'}>
            <Col>
              <EmojiIcon emoji={'😛'} size='mini' />
              <EmojiIcon emoji={'😛'} size='tiny' />
              <EmojiIcon emoji={'😛'} size='small' />
              <EmojiIcon emoji={'😛'} />
              <EmojiIcon emoji={'😛'} size='large' />
              <EmojiIcon emoji={'😛'} size='big' />
              <EmojiIcon emoji={'😛'} size='huge' />
              <EmojiIcon emoji={'😛'} size='massive' />
            </Col>
          </Row>

          <Row columns={'equal'}>
            <Col>
              <CustomIcon name='lords' logo size='mini' />
              <CustomIcon name='lords' logo size='tiny' />
              <CustomIcon name='lords' logo size='small' />
              <CustomIcon name='lords' logo />
              <CustomIcon name='lords' logo size='large' />
              <CustomIcon name='lords' logo size='big' />
              <CustomIcon name='lords' logo size='huge' />
              <CustomIcon name='lords' logo size='massive' color='yellow' />
            </Col>
          </Row>

          <Row columns={'equal'}>
            <Col>
              <CustomIcon name='lords_bag' logo png size='mini' />
              <CustomIcon name='lords_bag' logo png size='tiny' />
              <CustomIcon name='lords_bag' logo png size='small' />
              <CustomIcon name='lords_bag' logo png />
              <CustomIcon name='lords_bag' logo png size='large' />
              <CustomIcon name='lords_bag' logo png size='big' />
              <CustomIcon name='lords_bag' logo png size='huge' />
              <CustomIcon name='lords_bag' logo png size='massive' />
            </Col>
          </Row>

          <Row columns={'equal'}>
            <Col>
              <LordsBagIcon size='mini' />
              <LordsBagIcon size='tiny' />
              <LordsBagIcon size='small' />
              <LordsBagIcon size='small' />
              <LordsBagIcon />
              <LordsBagIcon size='large' />
              <LordsBagIcon size='big' />
              <LordsBagIcon size='huge' />
              <LordsBagIcon size='massive' />
            </Col>
          </Row>

        </Grid>
      </Container>
    </App>
  );
}
