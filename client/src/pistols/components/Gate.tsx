import React from 'react'
import { useRouter } from 'next/navigation'
import { Divider, Grid, Icon } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useDojoChain } from '@/lib/dojo/hooks/useDojoChain'
import { useBurners } from '@/lib/wallet/useBurnerAccount'
import { AccountMenuKey, usePistolsContext } from '../hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from './ui/Buttons'
import { LordsBagIcon } from './account/Wager'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import OnboardingModal from './account/OnboardingModal'
import Logo from './Logo'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  const { isConnected, isCorrectChain } = useDojoChain()
  return (
    <div className='UIContainer'>

      <VStack>
        <Logo />

        <h1>Pistols at Ten Blocks</h1>

        <hr />

        {!isConnected ?
          <span className='Title'>
            This game requires need a <b>Starknet wallet</b>
            <br />and some <LordsBagIcon /><b>LORDS</b> to play
          </span>
          : <WalletHeader />
        }

      </VStack>

      {isCorrectChain ? <ConnectedGate /> : <DisconnectedGate switchChain={isConnected && !isCorrectChain} />}

    </div>
  )
}


function DisconnectedGate({
  switchChain = false,
}) {
  // const { isConnected, isCorrectChain } = useDojoChain()
  const { connectOpener } = usePistolsContext()
  const router = useRouter()

  const _enterAsGuest = () => {
    router.push('/tavern')
  }

  return (
    <>
      <VStack>

        <ActionButton fill large onClick={() => connectOpener.open()} label={switchChain ? 'Switch Chain' :'Connect Wallet'} />

        <Divider />

        <ActionButton fill large onClick={() => _enterAsGuest()} label='Enter as Guest' />
      </VStack>

      <StarknetConnectModal opener={connectOpener} />
    </>
  )
}



function ConnectedGate() {
  const { remove, applyFromClipboard, copyToClipboard, masterAccount, count } = useDojoAccount()
  const { accountSetupOpener, dispatchSetAccountMenu, dispatchSetAccountIndex } = usePistolsContext()
  const { burners, nextAccountIndex } = useBurners(masterAccount.address)

  const _deployDuelist = () => {
    dispatchSetAccountIndex(nextAccountIndex)
    dispatchSetAccountMenu(AccountMenuKey.Deploy)
    accountSetupOpener.open()
  }

  const _deleteAll = () => {
    Object.values(burners).forEach(burner => {
      remove(burner.address)
    })
  }

  return (
    <>
      <VStack>

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
