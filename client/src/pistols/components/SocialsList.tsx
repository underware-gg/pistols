import React from 'react'
import { Grid, Image } from 'semantic-ui-react'
import { VStack } from '@/lib/ui/Stack'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { CustomIcon } from '@/lib/ui/Icons'

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

        <Row columns={1} className='NoPadding'>
          <Col><Divider /></Col>
        </Row>

        <ConnectDiscord />

        <Row columns={1} className='NoPadding'>
          <Col><Divider /></Col>
        </Row>

        <ConnectTelegram />

        <Row columns={1} className='NoPadding'>
          <Col><Divider /></Col>
        </Row>

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
  isConnected,
  canClick,
  onClick,
}: {
  name: string
  logoName: string
  status: string
  isConnected: boolean
  canClick: boolean
  onClick: Function
}) {

  const _status = 'not connected'

  return (
    <Row textAlign='center' verticalAlign='top'>
      <Col width={3} className='NoPadding'>
        <CustomIcon logo name={logoName} size={'huge'} disabled={!isConnected} />
      </Col>
      <Col width={8} textAlign='left'>
        <h4>{name}</h4>
        <span className='H4'>{status}</span>
      </Col>
      <Col width={5} textAlign='left' verticalAlign='bottom'>
        <ActionButton fill important disabled={!canClick} onClick={() => onClick()} label={isConnected ? 'Disconnect' : 'Connect'} />
      </Col>
    </Row>
  )
}

function ConnectDiscord() {
  const isConnected = false
  const status = 'not connected'
  const _connect = () => {
  }
  return (
    <SocialItem
      name='Discord'
      logoName='discord'
      status={status}
      isConnected={isConnected}
      canClick={true}
      onClick={() => _connect()}
    />
  )
}

function ConnectTelegram() {
  const isConnected = false
  const status = 'not connected'
  const _connect = () => {
  }
  return (
    <SocialItem
      name='Telegram'
      logoName='telegram'
      status={status}
      isConnected={isConnected}
      canClick={false}
      onClick={() => _connect()}
    />
  )
}

function ConnectTwitter() {
  const isConnected = false
  const status = 'not connected'
  const _connect = () => {
  }
  return (
    <SocialItem
      name='X'
      logoName='twitter'
      status={status}
      isConnected={isConnected}
      canClick={false}
      onClick={() => _connect()}
    />
  )
}
