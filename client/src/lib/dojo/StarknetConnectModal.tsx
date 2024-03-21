import React, { useEffect, useMemo } from 'react'
import { Grid, Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { Opener } from '@/lib/ui/useOpener'

const Row = Grid.Row
const Col = Grid.Column

export default function StarknetConnectModal({
  opener,
}: {
  opener: Opener
}) {
  const { connect, connectors } = useConnect()
  const { isConnecting, isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) {
      opener.close()
    }
  }, [isConnected])

  let buttons = useMemo(() => connectors.map((connector: Connector) => (
    <Row key={connector.id}>
      <Col>
        <Button fluid size='huge' disabled={!connector.available() || isConnecting} onClick={() => connect({ connector })}>
          Connect {connector.name}
          <Image spaced className='Square20' src={connector.icon.dark} style={{ maxHeight: '1em' }} />
        </Button>
      </Col>
    </Row>
  )), [connectors, isConnecting])

  return (
    <Modal
      size='small'
      className='StarknetConnectModal'
      onClose={() => opener.close()}
      open={opener.isOpen}
    >
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          <Grid columns='equal'>
            {buttons}
            <Row>
              <Col>
                <Button fluid size='huge' onClick={() => window.open(`https://www.starknet.io/en/ecosystem/wallets`, '_blank')}>
                  I don't have a Wallet
                </Button>
              </Col>
            </Row>
          </Grid>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}
