import React, { useEffect, useMemo } from 'react'
import { Grid, Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { Opener } from '@/lib/ui/useOpener'
import { VStack } from '../ui/Stack'

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
    <Button key={connector.id} fluid size='huge' disabled={!connector.available() || isConnecting} onClick={() => connect({ connector })}>
      Connect {connector.name}
      <Image spaced className='Square20' src={connector.icon.dark} style={{ maxHeight: '1em' }} />
    </Button>
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
          <VStack>
            {[...buttons,
              <Button key='nowallet' fluid size='huge' onClick={() => window.open(`https://www.starknet.io/en/ecosystem/wallets`, '_blank')}>
                I don't have a Wallet
              </Button>
            ]}
          </VStack>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}
