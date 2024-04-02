import React from 'react'
import { useRouter } from 'next/navigation'
import { Divider, Grid, Icon } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useAccount } from '@starknet-react/core'
import { useDojoAccount } from '@/dojo/DojoContext'
import { AccountMenuKey, usePistolsContext } from '../hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from './ui/Buttons'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import OnboardingModal from './account/OnboardingModal'
import Logo from './Logo'
import { LordsBagIcon } from './account/Wager'

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
  const { connectOpener } = usePistolsContext()
  const router = useRouter()

  const _enterAsGuest = () => {
    router.push('/tavern')
  }

  return (
    <>
      <VStack>
        <span className='Title'>
          This game requires need a <b>Starknet wallet</b>
          <br />and some <LordsBagIcon /><b>LORDS</b> to play
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
  const {
    create, list, get, select, clear, applyFromClipboard, copyToClipboard,
    account, isMasterAccount, masterAccount, isDeploying, count,
  } = useDojoAccount()
  const { accountSetupOpener, dispatchSetAccountMenu } = usePistolsContext()

  const _deployDuelist = () => {
    dispatchSetAccountMenu(AccountMenuKey.Deploy)
    accountSetupOpener.open()
  }

  const _deleteAll = () => {
    clear()
    location.reload()
  }

  return (
    <>
      <VStack>
        <WalletHeader />

        <VStackRow>
          {/* <ActionButton fill disabled={isDeploying} onClick={() => create()} label='Create Duelist' /> */}
          <ActionButton fill onClick={() => _deployDuelist()} label='Deploy Duelist' />
          <ActionButton fill disabled={count == 0} onClick={() => copyToClipboard()} label={<>Export All <Icon name='copy' size='small' /></>} />
          <ActionButton fill disabled={false} onClick={() => applyFromClipboard()} label={<>Import All <Icon name='paste' size='small' /></>} />
          <ActionButton fill disabled={count == 0} onClick={() => _deleteAll()} label='Delete All' />
        </VStackRow>

      </VStack>
      <Divider />

      <AccountsList />

      <OnboardingModal opener={accountSetupOpener} />
    </>
  )
}
