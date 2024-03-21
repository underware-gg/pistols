import React from 'react'
import { Divider, Grid } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useOpener } from '@/lib/ui/useOpener'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import Logo from './Logo'
import { ActionButton } from './ui/Buttons'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import { useRouter } from 'next/navigation'
import WalletHeader from './account/WalletHeader'

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
  const opener = useOpener()
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
            <ActionButton fill large onClick={() => opener.open()} label='Connect Wallet' />
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

      <StarknetConnectModal opener={opener} />
    </>
  )
}



function ConnectedGate() {
  // const { disconnect } = useDisconnect()
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
      </Grid>

      <AccountsList />
    </>
  )
}
