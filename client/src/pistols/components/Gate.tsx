import React from 'react'
import { useRouter } from 'next/navigation'
import { Divider, Grid, Icon } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useOpener } from '@/lib/ui/useOpener'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from './ui/Buttons'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import Logo from './Logo'
import AccountSetupModal from './account/AccountSetupModal'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  const { isConnected } = useAccount()
  return (
    <div className='UIContainer'>

      <Grid colums='equal' className='FillWidth'>
        <Row>
          <Col>
            <Logo />
          </Col>
        </Row>

        <Row textAlign='center' className='TitleCase'>
          <Col>
            <h1>Pistols at Ten Blocks</h1>
          </Col>
        </Row>

        <Row>
          <Col>
            <hr />
          </Col>
        </Row>

      </Grid>

      {isConnected ? <ConnectedGate /> : <DisconnectedGate />}

    </div>
  )
}


function DisconnectedGate() {
  const { connectOpener } = useSettingsContext()
  const router = useRouter()

  const _enterAsGuest = () => {
    router.push('/tavern')
  }

  return (
    <>
      <Grid columns='equal' textAlign='center'>
        <Row className='Title'>
          <Col>
            You need a Starknet wallet and some $LORDS to play
          </Col>
        </Row>
        <Row>
          <Col>
            <ActionButton fill large onClick={() => connectOpener.open()} label='Connect Wallet' />
          </Col>
        </Row>
        <Row>
          <Col>
            <Divider />
          </Col>
        </Row>
        <Row>
          <Col>
            <ActionButton fill large onClick={() => _enterAsGuest()} label='Enter as Guest' />
          </Col>
        </Row>
      </Grid>

      <StarknetConnectModal opener={connectOpener} />
    </>
  )
}



function ConnectedGate() {
  // const { disconnect } = useDisconnect()
  const accountSetupOpener = useOpener()
  return (
    <>
      <Grid columns='equal' textAlign='center'>
        <Row>
          <Col>
            <WalletHeader />
          </Col>
        </Row>
        {/* <Row>
          <Col>
            <ActionButton fill large onClick={() => disconnect()} label='Disconnect' />
          </Col>
        </Row> */}
        <Row>
          <Col>
            <Divider />
          </Col>
        </Row>
        
        <Row>
          <Col>
            {/* <ActionButton fill disabled={isDeploying} onClick={() => create()} label='Create Duelist' /> */}
            <ActionButton fill onClick={() => accountSetupOpener.open()} label='Create Duelist' />
          </Col>
          <Col>
            <ActionButton fill disabled={true} onClick={() => { }} label={<>Import&nbsp;&nbsp;<Icon name='paste' size='small' /></>} />
          </Col>
          <Col>
            <ActionButton fill disabled={true} onClick={() => { }} label='Delete All' />
          </Col>

        </Row>

        
      </Grid>

      <AccountSetupModal opener={accountSetupOpener} />
      <AccountsList />
    </>
  )
}
