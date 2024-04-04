import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { useDojoChain } from '@/lib/dojo/hooks/useDojoChain'
import { Opener } from '@/lib/ui/useOpener'
import { VStack } from '@/lib/ui/Stack'


export default function StarknetConnectModal({
  opener,
}: {
  opener: Opener
}) {
  const { isConnected, isCorrectChain } = useDojoChain()

  useEffect(() => {
    if (isCorrectChain) {
      opener.close()
    }
  }, [isCorrectChain])

  return (
    <Modal
      size='small'
      className='StarknetConnectModal'
      onClose={() => opener.close()}
      open={opener.isOpen}
    >
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          {!isConnected ? <ConnectButtons />
            : !isCorrectChain ? <SwitchChainButtons />
              : <></>
          }
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}

function ConnectButtons() {
  const { connect, connectors } = useConnect()
  const { isConnecting } = useAccount()

  let buttons = useMemo(() => connectors.map((connector: Connector) => (
    <Button key={connector.id} fluid size='huge' disabled={!connector.available() || isConnecting} onClick={() => connect({ connector })}>
      Connect {connector.name}
      <Image spaced className='Square20' src={connector.icon.dark} style={{ maxHeight: '1em' }} />
    </Button>
  )), [connectors, isConnecting])

  return (
    <VStack>
      {[...buttons,
      <Button key='nowallet' fluid size='huge' onClick={() => window?.open(`https://www.starknet.io/en/ecosystem/wallets`, '_blank')}>
        I don't have a Wallet
      </Button>
      ]}
    </VStack>
  )
}

function SwitchChainButtons() {
  const { connectedChainName, selectedChainName, switch_network, add_network } = useDojoChain()
  const [chainExists, setChainExists] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  const _switchNetwork = () => {
    setIsBusy(true)
    switch_network().then((response) => {
      console.log(`wallet_switchStarknetChain RESPONSE:`, response)
      setIsBusy(false)
      if (!response) {
        setChainExists(false)
      }
    }).catch((error) => {
      console.error(`wallet_switchStarknetChain ERROR:`, error)
      setIsBusy(false)
    })
  }

  const _addNetwork = () => {
    setIsBusy(true)
    add_network().then((response) => {
      console.log(`wallet_addStarknetChain RESPONSE:`, response)
      if (response) {
        setChainExists(true)
        _switchNetwork()
      } else {
        setIsBusy(false)
      }
    }).catch((error) => {
      console.error(`wallet_addStarknetChain ERROR:`, error)
      setIsBusy(false)
    })
  }

  useEffect(() => {
    if (!chainExists) {
      _addNetwork()
    }
  }, [chainExists])

  return (
    <VStack>
      <div className='ModalText'>
        Connected to <b>{connectedChainName}</b>
        <br />
        Need <b>{selectedChainName}</b>
      </div>
      <Button fluid size='huge' disabled={isBusy} onClick={() => { (chainExists ? _switchNetwork : _addNetwork)() }}>
        {chainExists ? 'Switch Network' : 'Add Network'}
      </Button>
    </VStack>
  )
}
