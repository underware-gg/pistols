import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { useChainSwitchCallbacks, useDojoSetup, useIsConnectedToSelectedNetwork } from '@underware/pistols-sdk/dojo'
import { getConnectorIcon } from '@underware/pistols-sdk/pistols/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
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
  const { isConnected, isCorrectNetwork } = useIsConnectedToSelectedNetwork()

  // always closed on mount
  const mounted = useMounted(() => {
    opener.close()
  })

  useEffect(() => {
    if (isConnected) {
      opener.close()
    }
  }, [isConnected])

  return (
    <Modal
      size='small'
      className='StarknetConnectModal'
      onClose={() => opener.close()}
      open={mounted && opener.isOpen}
    >
      <Modal.Content>
        {!isConnected ? <ConnectButtons walletHelp={walletHelp} />
          : !isCorrectNetwork ? <SwitchChainButtons />
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
  const { selectedNetworkConfig } = useDojoSetup()
  const { connect, connectors } = useConnect()
  const { isConnecting } = useAccount()

  let connectorsButtons = useMemo(() => connectors.reduce((acc, connector: Connector) => {
    if (selectedNetworkConfig.connectorIds.includes(connector.id)) {
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
        {/* Connect to <b>{selectedNetworkConfig.name} ({selectedNetworkId})</b> */}
        Connect to <b>{selectedNetworkConfig.name}</b>
      </div>
      <Divider content={'with'} />
      <VStack>
        {buttons}
      </VStack>
    </VStack>
  )
}

function SwitchChainButtons() {
  const { selectedNetworkId, selectedNetworkConfig } = useDojoSetup()
  const { switch_starknet_chain } = useChainSwitchCallbacks()
  const [isBusy, setIsBusy] = useState(false)

  const _switchNetwork = () => {
    setIsBusy(true)
    switch_starknet_chain().then((response) => {
      console.log(`wallet_switchStarknetChain RESPONSE:`, response)
      setIsBusy(false)
    }).catch((error) => {
      console.error(`wallet_switchStarknetChain ERROR:`, error)
      setIsBusy(false)
    })
  }

  return (
    <VStack>
      <div className='ModalText'>
        <p>
          Connected to <b>{selectedNetworkConfig.name} ({selectedNetworkId})</b>
        </p>
        <p>
          Need <b>{selectedNetworkConfig.name} ({selectedNetworkId})</b>
        </p>
      </div>
      <Divider />
      <Button fluid size='huge' disabled={isBusy} onClick={() => { _switchNetwork() }}>
        Switch Network
      </Button>
    </VStack>
  )
}
