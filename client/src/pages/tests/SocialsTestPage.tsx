import React from 'react'
import { BigNumberish } from 'starknet'
import { Button, Container, Table } from 'semantic-ui-react'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { useConfig } from '/src/stores/configStore'
import { Address } from '/src/components/ui/Address'
import { LordsBalance } from '/src/components/account/LordsBalance'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TestPageMenu } from './TestPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { useAccount } from '@starknet-react/core'
import { usePlayer, useTeamMembersAccounts } from '/src/stores/playerStore'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { usePlayerSocialLink } from '/src/stores/eventsModelStore'
import { DiscordLinkButton } from '/src/components/socials/Discord'
import { EventsModelStoreSync } from '/src/stores/sync/EventsModelStoreSync'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell


export default function SocialsTestPage() {
  return (
    <AppDojo>
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
  const { isLinked } = usePlayerSocialLink(constants.SocialPlatform.Discord)
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
  const { userName, userId } = usePlayerSocialLink(socialPlatform)
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
      </>
  )
}

