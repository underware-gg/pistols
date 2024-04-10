import React from 'react'
import { useRouter } from 'next/navigation'
import { Divider, Grid, Icon } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useDojoChain } from '@/lib/dojo/hooks/useDojoChain'
import { useDojoSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useBurners } from '@/lib/dojo/hooks/useBurnerAccount'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { LordsBagIcon } from '@/pistols/components/account/Balance'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import OnboardingModal from '@/pistols/components/account/OnboardingModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import Logo from '@/pistols/components/Logo'

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
            Duelists require need a <b>Starknet wallet</b>
            <br />and some <LordsBagIcon /><b>LORDS</b> to play
          </span>
          : <WalletHeader />
        }

      </VStack>

      {isCorrectChain ? <ConnectedGate /> : <DisconnectedGate switchChain={isConnected && !isCorrectChain} />}

    </div>
  )
}

function EnterAsGuestButton() {
  const { deselect } = useDojoAccount()
  const router = useRouter()

  const _enterAsGuest = () => {
    deselect()
    router.push('/tavern')
  }

  return (
    <ActionButton fill large onClick={() => _enterAsGuest()} label='Enter as Guest' />
  )
}


function DisconnectedGate({
  switchChain = false,
}) {
  const { connectOpener } = usePistolsContext()
  return (
    <>
      <VStack>
        <ActionButton fill large onClick={() => connectOpener.open()} label={switchChain ? 'Switch Chain' :'Connect Wallet'} />
        <Divider />
        <EnterAsGuestButton />
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

  const { systemExists } = useDojoSystem('actions')

  if (systemExists === false) {
    return (
      <VStack>
        <hr />
        <h3 className='TitleCase Negative'>Deployment not found!</h3>
      </VStack>
    )
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
      
      <AccountsList />

      <Divider />
      <EnterAsGuestButton />

      <OnboardingModal opener={accountSetupOpener} />
    </>
  )
}
