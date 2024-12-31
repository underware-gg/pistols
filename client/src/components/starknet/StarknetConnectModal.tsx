import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { useChainSwitchCallbacks, useSelectedChain, getConnectorIcon } from '@underware_gg/pistols-sdk/dojo'
import { useMounted } from '@underware_gg/pistols-sdk/utils'
import { Opener } from '/src/hooks/useOpener'
import { VStack } from '/src/components/ui/Stack'
import { Divider } from '/src/components/ui/Divider'

export default function StarknetConnectModal({
  opener,
  walletHelp = false,
}: {
  opener: Opener
  walletHelp?: boolean
}) {
  const { isConnected, isCorrectChain } = useSelectedChain()

  // always closed on mount
  const mounted = useMounted(() => {
    opener.close()
  })

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
        {!isConnected ? <ConnectButtons walletHelp={walletHelp} />
          : !isCorrectChain ? <SwitchChainButtons />
            : <></>
        }
      </Modal.Content>
    </Modal>
  )
}

function ConnectButtons({
  walletHelp,
}: {
  walletHelp: boolean
}) {
  const { selectedChainName, selectedChainConfig } = useSelectedChain()
  const { connect, connectors } = useConnect()
  const { isConnecting } = useAccount()

  let connectorsButtons = useMemo(() => connectors.reduce((acc, connector: Connector) => {
    if (selectedChainConfig.connectorIds.includes(connector.id)) {
      acc.push(
        <Button key={connector.id} fluid size='huge'
          disabled={!connector.available() || isConnecting}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          <Image spaced className='Square20' src={getConnectorIcon(connector)} style={{ maxHeight: '1em' }} />
        </Button>
      )
    }
    return acc
  }, []), [connectors, isConnecting])

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
      <div className='ModalText'>
        {/* Connect to <b>{selectedChainName} ({selectedChainId})</b> */}
        Connect to <b>{selectedChainName}</b>
      </div>
      <Divider content={'with'} />
      <VStack>
        {buttons}
      </VStack>
    </VStack>
  )
}

function SwitchChainButtons() {
  const {
    connectedChainId, connectedChainName,
    selectedChainId, selectedChainName,
  } = useSelectedChain()
  const { switch_starknet_chain, add_starknet_chain } = useChainSwitchCallbacks()
  const [chainExists, setChainExists] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  const _switchNetwork = () => {
    setIsBusy(true)
    switch_starknet_chain().then((response) => {
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
    add_starknet_chain().then((response) => {
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
