import React, { useEffect, useMemo } from 'react'
import { Grid, Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'

const Row = Grid.Row
const Col = Grid.Column

export default function StarknetConnectModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: Function
}) {
  const { connect, connectors } = useConnect()
  const { isConnecting, isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) {
      setIsOpen(false)
    }
  }, [isConnected])

  let buttons = useMemo(() => connectors.map((connector: Connector) => (
    <Row>
      <Col>
        <Button
          key={connector.id}
          fluid
          size='huge'
          verr
          onClick={() => connect({ connector })}
          disabled={!connector.available() || isConnecting}
        >
          Connect {connector.name}
          &nbsp;&nbsp;&nbsp;
          <Image className='Square20' src={connector.icon.dark} style={{ maxHeight: '1em' }} />
        </Button>
      </Col>
    </Row>
  )), [connectors, isConnecting])

  return (
    <Modal
      size='small'
      className='StarknetConnectModal'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          <Grid columns='equal'>
            {buttons}
          </Grid>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}
