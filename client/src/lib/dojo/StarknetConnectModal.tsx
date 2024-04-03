import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Button, Image } from 'semantic-ui-react'
import { useConnect, Connector, useAccount, useNetwork, useStarkAddress } from '@starknet-react/core'
import { Opener } from '@/lib/ui/useOpener'
import { VStack } from '../ui/Stack'
import { useDojoWallet } from './hooks/useDojoWallet'
import { CHAIN_ID } from './setup/chains'
import { ec } from 'starknet'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'
import { useEffectOnce } from '../hooks/useEffectOnce'
import { bigintToHex } from '../utils/types'

const Row = Grid.Row
const Col = Grid.Column

interface AddStarknetChainParametersImpl extends AddStarknetChainParameters {
  // accountImplementation: string, // ArgentX class hash
  // accountClassHash: string, // ArgentX class hash
  classHash: string, // ArgentX class hash
  rpcUrl: string,
}

export default function StarknetConnectModal({
  opener,
}: {
  opener: Opener
}) {
  const { isConnected, isCorrectChain } = useDojoWallet()

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
      <Button key='nowallet' fluid size='huge' onClick={() => window.open(`https://www.starknet.io/en/ecosystem/wallets`, '_blank')}>
        I don't have a Wallet
      </Button>
      ]}
    </VStack>
  )
}

function SwitchChainButtons() {
  const { connectedChainId, connectedChainName, selectedChainId, selectedChainName, dojoChainConfig } = useDojoWallet()
  const [chainExists, setChainExists] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  const _switchNetwork = () => {
    setIsBusy(true)
    // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
    const params: SwitchStarknetChainParameter = {
      chainId: selectedChainId,
    }
    console.log(`wallet_switchStarknetChain...`, params)
    window?.starknet?.request({ type: 'wallet_switchStarknetChain', params }).then((response) => {
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
    // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
    const params: AddStarknetChainParametersImpl = {
      id: selectedChainId,
      chainId: selectedChainId,
      chainName: dojoChainConfig.name,
      baseUrl: dojoChainConfig.rpcUrl,
      rpcUrl: dojoChainConfig.rpcUrl,
      rpcUrls: [dojoChainConfig.rpcUrl],
      nativeCurrency: dojoChainConfig.chainConfig.nativeCurrency,
      // accountImplementation: dojoChainConfig.accountClassHash,
      // accountClassHash: dojoChainConfig.accountClassHash,
      classHash: dojoChainConfig.accountClassHash,
      // blockExplorerUrls?: string[],
      // iconUrls?: string[],
    }
    console.log(`wallet_addStarknetChain...`, params)
    window?.starknet?.request({ type: 'wallet_addStarknetChain', params }).then((response) => {
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
