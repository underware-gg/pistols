import React from 'react'
import { Container, Table } from 'semantic-ui-react'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TestPageMenu } from './TestPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { usePlayerDiscordSocialLink, usePlayerSocialLink } from '/src/stores/eventsModelStore'
import { DiscordLinkButton } from '/src/components/socials/Discord'
import { EventsModelStoreSync } from '/src/stores/sync/EventsModelStoreSync'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell


export default function SocialsTestPage() {
  return (
    <AppDojo subtitle='Test: Socials'>
      <Container>
        <TestPageMenu />
        <CurrentChainHint />
        <Connect />

        <Discord />

        <EntityStoreSync />
        <PlayerNameSync />
        <EventsModelStoreSync />
      </Container>
    </AppDojo>
  );
}

function Discord() {
  const { isLinked, avatarUrl } = usePlayerDiscordSocialLink()
  return (
    <Table celled striped size='small' color='green' className='ModalText'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Discord</h3></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body>
        <SocialPlatform socialPlatform={constants.SocialPlatform.Discord} />
        <Row>
          <Cell>
            {avatarUrl && <img src={avatarUrl} alt='avatar' />}
          </Cell>
          <Cell className='Code'>
            <DiscordLinkButton />
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


function SocialPlatform({
  socialPlatform,
}: {
  socialPlatform: constants.SocialPlatform,
}) {
  const { userName, userId, avatar } = usePlayerSocialLink(socialPlatform)
  return (
    <>
      <Row>
        <Cell>
          user_name:
        </Cell>
        <Cell className='Code'>
          {userName || '-'}
        </Cell>
      </Row>
      <Row>
        <Cell>
          user_id:
        </Cell>
        <Cell className='Code'>
          {userId || '-'}
        </Cell>
      </Row>
      <Row>
        <Cell>
          avatar:
        </Cell>
        <Cell className='Code'>
          {avatar || '-'}
        </Cell>
      </Row>
    </>
  )
}

