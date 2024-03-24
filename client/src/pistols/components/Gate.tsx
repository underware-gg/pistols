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
import { VStack, VStackRow } from '@/lib/ui/Stack'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  const { isConnected } = useAccount()
  return (
    <div className='UIContainer'>

      <VStack>
        <Logo />

        <h1>Pistols at Ten Blocks</h1>
        
        <hr />
      </VStack>

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
      <VStack>
        <span className='Title'>
          You need a Starknet wallet and some $LORDS to play
        </span>

        <ActionButton fill large onClick={() => connectOpener.open()} label='Connect Wallet' />

        <Divider />

        <ActionButton fill large onClick={() => _enterAsGuest()} label='Enter as Guest' />
      </VStack>

      <StarknetConnectModal opener={connectOpener} />
    </>
  )
}



function ConnectedGate() {
  const accountSetupOpener = useOpener()
  return (
    <>
      <VStack>
        <WalletHeader />

        <Divider />

        <VStackRow>
          {/* <ActionButton fill disabled={isDeploying} onClick={() => create()} label='Create Duelist' /> */}
          <ActionButton fill onClick={() => accountSetupOpener.open()} label='Create Duelist' />
          <ActionButton fill disabled={true} onClick={() => { }} label={<>Import&nbsp;&nbsp;<Icon name='paste' size='small' /></>} />
          <ActionButton fill disabled={true} onClick={() => { }} label='Delete All' />
        </VStackRow>

      </VStack>

      <AccountSetupModal opener={accountSetupOpener} />
      <AccountsList />
    </>
  )
}
