import React from 'react'
import { useRouter } from 'next/navigation'
import { Divider, Dropdown, Grid, Icon } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useDojoAccount, useDojoStatus } from '@/lib/dojo/DojoContext'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useDojoSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useBurners } from '@/lib/dojo/hooks/useBurnerAccount'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { LordsBagIcon } from '@/pistols/components/account/Balance'
import { feltToString } from '@/lib/utils/starknet'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import OnboardingModal from '@/pistols/components/account/OnboardingModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import Logo from '@/pistols/components/Logo'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  const { isConnected, isCorrectChain } = useSelectedChain()
  const { isLoading, isError } = useDojoStatus()
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

      {(isLoading || isError || !isCorrectChain) ?
        <DisconnectedGate />
        : <ConnectedGate />
      }

    </div>
  )
}


//----------------------------------
// Disconnected Gate
//
function DisconnectedGate() {
  const { connectOpener } = usePistolsContext()
  const { isConnected, isCorrectChain } = useSelectedChain()
  const { isLoading, loadingMessage, isError, errorMessage } = useDojoStatus()

  const canConnect = (!isLoading && !isError)
  const switchChain = (isConnected && !isCorrectChain)

  return (
    <>
      <VStack>
        <ChainSwitcher disabled={isLoading} />
        <ActionButton fill large disabled={!canConnect} onClick={() => connectOpener.open()} label={switchChain ? 'Switch Chain' : 'Connect Wallet'} />
        <Divider />
        {isLoading ? <h3 className='TitleCase Important'>{loadingMessage}</h3>
          : isError ? <h3 className='TitleCase Negative'>{errorMessage}</h3>
            : <EnterAsGuestButton />
        }
      </VStack>

      <StarknetConnectModal opener={connectOpener} />
    </>
  )
}

function ChainSwitcher({
  disabled = false
}) {
  const { chains, selectedChainConfig, selectChainId } = useStarknetContext()
  return (
    <Dropdown
      text={`Server:  ${selectedChainConfig.name}`}
      disabled={disabled}
      className='icon AlignCenter Padded'
      icon='chain'
      button
      fluid
    >
      <Dropdown.Menu>
        {chains.map(chain => (
          <Dropdown.Item key={chain.name} onClick={() => { selectChainId(feltToString(chain.id) as CHAIN_ID) }}>{chain.name}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
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


//----------------------------------
// Connected Gate
//

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
