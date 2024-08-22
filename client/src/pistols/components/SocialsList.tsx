import React from 'react'
import { Grid } from 'semantic-ui-react'
import { RowDivider, VStack } from '@/lib/ui/Stack'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { CustomIcon } from '@/lib/ui/Icons'
import { useAccount } from '@starknet-react/core'

const Row = Grid.Row
const Col = Grid.Column

export function SocialsList() {

  return (
    <VStack className='Faded FillWidth UIAccountsListScroller_XX'>
      <Divider hidden />
      <Grid className='Faded FillWidth'>
        <Row columns={'equal'} className='Title'>
          <Col>
            Connect Social Accounts
          </Col>
        </Row>

        <RowDivider />
        <ConnectDiscord />

        <RowDivider />
        <ConnectTelegram />

        <RowDivider />
        <ConnectTwitter />

      </Grid>
      <Divider />
    </VStack>
  )
}

function SocialItem({
  name,
  logoName,
  status,
  isSocialConnected,
  canClick,
  onClick,
}: {
  name: string
  logoName: string
  status: string
  isSocialConnected: boolean
  canClick: boolean
  onClick: Function
}) {
  const { isConnected } = useAccount()
  const canConnect = (canClick && isConnected && !isSocialConnected)
  return (
    <Row textAlign='center' verticalAlign='top'>
      <Col width={3} className='NoPadding'>
        <CustomIcon logo name={logoName} size={'huge'} disabled={!isSocialConnected} />
      </Col>
      <Col width={8} textAlign='left'>
        <h4>{name}</h4>
        <span className='H4'>{status}</span>
      </Col>
      <Col width={5} textAlign='left' verticalAlign='bottom'>
        <ActionButton fill important disabled={!canConnect} onClick={() => onClick()} label={isSocialConnected ? 'Disconnect' : 'Connect'} />
      </Col>
    </Row>
  )
}

function ConnectDiscord() {
  const isSocialConnected = false
  const status = 'not connected'
  const _connect = () => {
  }
  return (
    <SocialItem
      name='Discord'
      logoName='discord'
      status={status}
      isSocialConnected={isSocialConnected}
      canClick={true}
      onClick={() => _connect()}
    />
  )
}

function ConnectTelegram() {
  const isSocialConnected = false
  const status = 'not connected'
  const _connect = () => {
  }
  return (
    <SocialItem
      name='Telegram'
      logoName='telegram'
      status={status}
      isSocialConnected={isSocialConnected}
      canClick={false}
      onClick={() => _connect()}
    />
  )
}

function ConnectTwitter() {
  const isSocialConnected = false
  const status = 'not connected'
  const _connect = () => {
  }
  return (
    <SocialItem
      name='X'
      logoName='twitter'
      status={status}
      isSocialConnected={isSocialConnected}
      canClick={false}
      onClick={() => _connect()}
    />
  )
}
