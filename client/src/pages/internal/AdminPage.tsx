import React, { useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { Button, Checkbox, Container, FormInput, Input, Table } from 'semantic-ui-react'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { STARKNET_ADDRESS_LENGTHS } from '@underware/pistols-sdk/starknet'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { useConfig } from '/src/stores/configStore'
import { Address } from '/src/components/ui/Address'
import { LordsBalance } from '/src/components/account/LordsBalance'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { useAccount } from '@starknet-react/core'
import { useBlockedPlayersAccounts, usePlayer, useTeamMembersAccounts } from '/src/stores/playerStore'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { useValidateWalletAddress } from '@underware/pistols-sdk/utils/hooks'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell


export default function AdminPage() {
  return (
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />
        <EntityStoreSync />
        <PlayerNameSync />

        <InternalPageWrapper>
          <Config />
          <TeamMembers />
          <BlockedPlayers />
          {/* <TeamMembersEditor /> */}
          <br />
          <EntityStoreSync />
        </InternalPageWrapper>

      </Container>
    </AppDojo>
  );
}


function Config() {
  const { account } = useAccount()
  const { isPaused, currentSeasonId, treasuryAddress, vrfAddress, lordsAddress } = useConfig()
  const { admin } = useDojoSystemCalls()
  return (
    <Table celled striped size='small' color='orange'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Config</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='Code'>
        <Row className='H5'>
          <Cell className='Important'>isPaused</Cell>
          <Cell textAlign='left'>
            {isPaused ? 'true' : 'false'}
          </Cell>
          <Cell>
            <Button disabled={isPaused} onClick={() => admin.set_paused(account, true)}>Pause</Button>
          </Cell>
          <Cell>
            <Button disabled={!isPaused} onClick={() => admin.set_paused(account, false)}>Unpause</Button>
          </Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>currentSeasonId</Cell>
          <Cell textAlign='left'>
            {currentSeasonId}
          </Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>Treasury</Cell>
          <Cell>
            <Address address={treasuryAddress} full />
          </Cell>
          <Cell>
            <ExplorerLink address={treasuryAddress} voyager />
          </Cell>
          <Cell>
            <LordsBalance address={treasuryAddress} decimals={3} />
          </Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>vrfAddress</Cell>
          <Cell>
            <Address address={vrfAddress} full />
          </Cell>
          <Cell>
            <ExplorerLink address={vrfAddress} voyager />
          </Cell>
          <Cell></Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>lordsAddress</Cell>
          <Cell>
            <Address address={lordsAddress} full />
          </Cell>
          <Cell>
            <ExplorerLink address={lordsAddress} voyager />
          </Cell>
          <Cell></Cell>
        </Row>
      </Body>
    </Table>
  )
}



//--------------------------------
// Team Members
//
function TeamMembers() {
  const { teamMembersAccounts } = useTeamMembersAccounts()
  return (
    <Table celled striped size='small' color='green'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Team Members</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell>Team Member</HeaderCell>
          <HeaderCell>Admin</HeaderCell>
        </Row>
      </Header>
      <Body>
        {teamMembersAccounts.map((address) => (
          <TeamMemberRow key={address} address={address} />
        ))}
      </Body>
    </Table>
  )
}

function TeamMemberRow({
  address,
}: {
  address: BigNumberish
}) {
  const { name, isAdmin, isTeamMember } = usePlayer(address)
  return (
    <Row className='H5'>
      <Cell className='Code'>
        {name}
      </Cell>
      <Cell>
        <Address address={address} full />
      </Cell>
      <Cell className='Code'>
        <ExplorerLink address={address} voyager />
      </Cell>
      <Cell>
        {isTeamMember && <span>Is Team Member</span>}
      </Cell>
      <Cell>
        {isAdmin && <span>Is Admin</span>}
      </Cell>
    </Row>
  )
}

function TeamMembersEditor() {
  const { account } = useAccount()
  const { admin } = useDojoSystemCalls()
  const [address, setAddress] = useState('')
  const [isTeamMember, setIsTeamMember] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const { isStarknetAddress } = useValidateWalletAddress(address)
  return (
    <Table attached='top' celled striped size='small' color='green'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Edit Team Members</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body>
        <Row>
          <Cell className='Code'>
            Wallet Address
          </Cell>
          <Cell>
            <Input fluid className='Code'
              value={address ?? ''}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={STARKNET_ADDRESS_LENGTHS[0]}
              placeholder={null}
            />
          </Cell>
        </Row>
        <Row>
          <Cell className='Code'>
            Is Team Member?
          </Cell>
          <Cell>
            <Checkbox
              checked={isTeamMember}
              onChange={(e, data) => setIsTeamMember(data.checked)}
            />
          </Cell>
        </Row>
        <Row>
          <Cell className='Code'>
            Is Admin?
          </Cell>
          <Cell>
            <Checkbox
              checked={isAdmin}
              onChange={(e, data) => setIsAdmin(data.checked)}
            />
          </Cell>
        </Row>
        <Row>
          <Cell></Cell>
          <Cell>
            <Button disabled={!isStarknetAddress} onClick={() => admin.set_is_team_member(account, address, isTeamMember, isAdmin)}>Submit</Button>
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


//--------------------------------
// Blocked Players
//
function BlockedPlayers() {
  const { blockedPlayersAccounts } = useBlockedPlayersAccounts()
  return (
    <Table celled striped size='small' color='red'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Blocked Players</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body>
        {blockedPlayersAccounts.map((address) => (
          <PlayerRow key={address} address={address} />
        ))}
      </Body>
    </Table>
  )
}

function PlayerRow({
  address,
}: {
  address: BigNumberish
}) {
  const { name } = usePlayer(address)
  return (
    <Row className='H5'>
      <Cell className='Code'>
        {name}
      </Cell>
      <Cell>
        <Address address={address} full />
      </Cell>
      <Cell className='Code'>
        <ExplorerLink address={address} voyager />
      </Cell>
    </Row>
  )
}
