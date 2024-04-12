import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Image, Divider } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { useChainSwitchCallbacks, useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { Opener } from '@/lib/ui/useOpener'
import { VStack } from '@/lib/ui/Stack'
import { useEffectOnce } from '../utils/hooks/useEffectOnce'


export default function StarknetConnectModal({
  opener,
  walletHelp = false,
}: {
  opener: Opener
  walletHelp?: boolean
}) {
  const { isConnected, isCorrectChain } = useSelectedChain()

  // always closed on mount
  const [mounted, setMounted] = useState(false)
  useEffectOnce(() => {
    setMounted(true)
    opener.close()
  }, [])

  useEffect(() => {
    if (isCorrectChain) {
      opener.close()
    }
  }, [isConnected, isCorrectChain])

  return (
    <Modal
      size='small'
      className='StarknetConnectModal'
      onClose={() => opener.close()}
      open={mounted && opener.isOpen}
    >
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          {!isConnected ? <ConnectButtons walletHelp={walletHelp} />
            : !isCorrectChain ? <SwitchChainButtons />
              : <></>
          }
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}

function ConnectButtons({
  walletHelp,
}: {
  walletHelp: boolean
}) {
  const { connect, connectors } = useConnect()
  const { isConnecting } = useAccount()

  let connectorsButtons = useMemo(() => connectors.map((connector: Connector) => (
    <Button key={connector.id} fluid size='huge' disabled={!connector.available() || isConnecting} onClick={() => connect({ connector })}>
      {connector.name}
      <Image spaced className='Square20' src={connector.icon.dark} style={{ maxHeight: '1em' }} />
    </Button>
  )), [connectors, isConnecting])

  const buttons = useMemo(() => {
    let buttons = [...connectorsButtons]
    if (walletHelp) {
      buttons.push(
        <Button key='walletHelp' fluid size='huge' onClick={() => window?.open(`https://www.starknet.io/en/ecosystem/wallets`, '_blank')}>
          I don't have a Wallet
        </Button>

      )
    }
    return buttons
  }, [connectorsButtons, walletHelp])

  return (
    <VStack>
      {buttons}
    </VStack>
  )
}

function SwitchChainButtons() {
  const {
    connectedChainId, connectedChainName,
    selectedChainId, selectedChainName,
  } = useSelectedChain()
  const { switch_network, add_network } = useChainSwitchCallbacks()
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
        <p>
          Connected to <b>{connectedChainName} ({connectedChainId})</b>
        </p>
        <p>
          Need <b>{selectedChainName} ({selectedChainId})</b>
        </p>
      </div>
      <Divider />
      <Button fluid size='huge' disabled={isBusy} onClick={() => { (chainExists ? _switchNetwork : _addNetwork)() }}>
        {chainExists ? 'Switch Network' : 'Add Network'}
      </Button>
    </VStack>
  )
}
