import React, { useEffect, useMemo, useState } from 'react'
import { Container, Icon, Table, Image } from 'semantic-ui-react'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TestPageMenu } from './TestPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDiscordSocialLink, usePlayerDiscordSocialLink, usePlayerSocialLink, useSocialLink } from '/src/stores/eventsModelStore'
import { DiscordLinkButton } from '/src/components/socials/Discord'
import { EventsModelStoreSync } from '/src/stores/sync/EventsModelStoreSync'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { WalletAddressRow } from '../internal/AdminPage'
import { bigintEquals } from '@underware/pistols-sdk/utils'

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
  const [address, setAddress] = useState('')
  const { address: playerAddress } = useAccount()
  useEffect(() => setAddress(playerAddress as string), [playerAddress])

  return (
    <Table celled striped size='small' color='green'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Discord</h3></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body>
        <WalletAddressRow address={address} setAddress={setAddress} label='Player Wallet' />
        <Row className='ModalText'>
          <Cell>Link/Unlink</Cell>
          <Cell>
            <DiscordLinkButton disabled={!bigintEquals(address, playerAddress)} />
          </Cell>
        </Row>
        <DiscordSocialPlatform address={address} />
        {/* <SocialPlatform socialPlatform={constants.SocialPlatform.Discord} address={address} /> */}
      </Body>
    </Table>
  )
}


function DiscordSocialPlatform({
  address,
}: {
  address: BigNumberish,
}) {
  const { userName, userId, avatar, avatarUrl, apiAvatarUrl, apiUserDatarUrl } = useDiscordSocialLink(address)

  const userData = useMemo(async () => {
    if (!apiUserDatarUrl) return {}
    const response = await fetch(apiUserDatarUrl)
    const data = await response.json()
    return data ?? {}
  }, [apiUserDatarUrl])

  const avatarStyle = {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    border: '1px solid #ccc8',
  }

  return (
    <>
      <Row className='ModalText'>
        <Cell>
          user_name:
        </Cell>
        <Cell className='Code'>
          {userName || '-'}
        </Cell>
      </Row>
      <Row className='ModalText'>
        <Cell>
          user_id:
        </Cell>
        <Cell className='Code'>
          {userId || '-'}
        </Cell>
      </Row>
      <Row className='ModalText'>
        <Cell>
          avatar:
        </Cell>
        <Cell className='Code'>
          {avatar || '-'}
        </Cell>
      </Row>
      <Row>
        <Cell></Cell>
        <Cell>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '0.25em'
          }}>
            <div style={{ display: 'flex' }}>
              <Image src={avatarUrl} alt='avatar' style={avatarStyle} />
            </div>
            <div style={{ display: 'flex' }}>
              <Icon name='arrow right' size='huge' />
            </div>
            <div style={{ display: 'flex' }}>
              <Image src={apiAvatarUrl} alt='api avatar' style={avatarStyle} />
            </div>
            <div style={{ display: 'flex' }}>
              <Icon name='arrow right' size='huge' />
            </div>
            <div style={{ display: 'flex' }}>
              <Image src={avatarUrl} alt='avatar' style={avatarStyle}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src = apiAvatarUrl;
                }}
              />
            </div>
          </div>

          <pre>{apiAvatarUrl}</pre>
        </Cell>
      </Row>
      <Row>
        <Cell className='ModalText'>/api/user</Cell>
        <Cell>
          <pre>
            {JSON.stringify(userData, null, 2)}
          </pre>
        </Cell>
      </Row>
    </>
  )
}

// function SocialPlatform({
//   socialPlatform,
//   address,
// }: {
//   socialPlatform: constants.SocialPlatform,
//   address: BigNumberish,
// }) {
//   // const { userName, userId, avatar } = usePlayerSocialLink(socialPlatform)
//   const { userName, userId, avatar } = useSocialLink(socialPlatform, address)
//   return (
//     <>
//       <Row className='ModalText'>
//         <Cell>
//           user_name:
//         </Cell>
//         <Cell className='Code'>
//           {userName || '-'}
//         </Cell>
//       </Row>
//       <Row className='ModalText'>
//         <Cell>
//           user_id:
//         </Cell>
//         <Cell className='Code'>
//           {userId || '-'}
//         </Cell>
//       </Row>
//       <Row className='ModalText'>
//         <Cell>
//           avatar:
//         </Cell>
//         <Cell className='Code'>
//           {avatar || '-'}
//         </Cell>
//       </Row>
//       <Row>
//         <Cell></Cell>
//         <Cell>
//           <Image src={avatarUrl} alt='avatar' style={avatarStyle} />
//           <Icon name='arrow right' size='huge' />
//           <Image src={apiAvatarUrl} alt='api avatar' style={avatarStyle} />
//         </Cell>
//       </Row>
//       <Row>
//         <Cell className='ModalText'>/api/user</Cell>
//         <Cell>
//           <pre>
//             {JSON.stringify(userData, null, 2)}
//           </pre>
//         </Cell>
//       </Row>
//     </>
//   )
// }

