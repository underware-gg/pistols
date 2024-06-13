import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dropdown, Grid, Icon } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoAccount, useDojoStatus } from '@/lib/dojo/DojoContext'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useBurners } from '@/lib/dojo/hooks/useBurnerAccount'
import { useOpener } from '@/lib/ui/useOpener'
import { ChainId } from '@/lib/dojo/setup/chains'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { LordsBagIcon } from '@/pistols/components/account/Balance'
import { Divider } from '@/lib/ui/Divider'
import { feltToString } from '@/lib/utils/starknet'
import { makeTavernUrl } from '@/pistols/utils/pistols'
import { PACKAGE_VERSION } from '@/pistols/utils/constants'
import OnboardingModal from '@/pistols/components/account/OnboardingModal'
import ExportAccountModal from '@/pistols/components/account/ExportAccountModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import Logo from '@/pistols/components/Logo'

const Row = Grid.Row
const Col = Grid.Column

export default function Gate() {
  const { isConnected, isConnecting, isCorrectChain } = useSelectedChain()
  const { isLoading, isError } = useDojoStatus()

  const { dispatchSelectDuel } = usePistolsContext()

  // cler tavern state
  useEffectOnce(() => {
    dispatchSelectDuel(0n)
  }, [])

  return (
    <div className='UIContainer'>

      <VStack>
        <Logo />

        <h1>Pistols at Ten Blocks</h1>

        <div className='Code Disabled'>v{PACKAGE_VERSION}</div>

        <hr />

        {!isConnected ?
          <span className='Title'>
            {/* Duelists use a <b>Controller wallet</b> */}
            {/* <br />and some <LordsBagIcon /><b>LORDS</b> to play */}
            Settle Your Grudges Honourably
            <br />Wager some <LordsBagIcon /><b>LORDS</b> or duel for free
          </span>
          : <WalletHeader />
        }

      </VStack>

      {(isLoading || isError || !isConnected || isConnecting || !isCorrectChain) ?
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
  const { isConnected, isConnecting, isCorrectChain } = useSelectedChain()
  const { isLoading, loadingMessage, isError, errorMessage } = useDojoStatus()

  const canConnect = (!isLoading && !isError)
  const switchChain = (isConnected && !isCorrectChain)

  return (
    <VStack>
      <ChainSwitcher disabled={isLoading} />
      <ActionButton fill large important disabled={!canConnect || isConnecting} onClick={() => connectOpener.open()} label={switchChain ? 'Switch Chain' : 'Connect Wallet'} />
      {isConnecting ?
        <div>
          <Divider />
          <h3 className='TitleCase Important'>Connecting...</h3>
        </div>
        : isLoading ?
          <div>
            <Divider />
            <h3 className='TitleCase Important'>{loadingMessage}</h3>
          </div>
          : isError ?
            <div>
              <Divider />
              <h3 className='TitleCase Negative'>{errorMessage}</h3>
              <Divider hidden />
              <ActionButton fill large important onClick={() => location.reload()} label='Retry' />
            </div>
            : <div>
              <Divider content='OR' />
              <br />
              <EnterAsGuestButton />
            </div>
      }
    </VStack>
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
      // icon='chain'
      button
      fluid
    >
      <Dropdown.Menu>
        {chains.map(chain => (
          <Dropdown.Item key={chain.name} onClick={() => { selectChainId(feltToString(chain.id) as ChainId) }}>{chain.name}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}


function EnterAsGuestButton() {
  const { deselect } = useDojoAccount()
  const router = useRouter()
  const { tableId } = useSettingsContext()

  const _enterAsGuest = () => {
    deselect()
    router.push(makeTavernUrl(tableId))
  }

  return (
    <ActionButton fill large onClick={() => _enterAsGuest()} label='Enter as Guest' />
  )
}


//----------------------------------
// Connected Gate
//

function ConnectedGate() {
  const { remove, masterAccount, count } = useDojoAccount()
  const { accountSetupOpener, dispatchSetAccountMenu, dispatchSetAccountIndex } = usePistolsContext()
  const { burners, nextAccountIndex } = useBurners(masterAccount.address)
  const exportOpener = useOpener()

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
          <ActionButton fill onClick={() => _deployDuelist()} label='Deploy New Duelist' />
          <ActionButton fill onClick={() => exportOpener.open()} label='Export / Import' />
          <ActionButton fill disabled={count == 0} onClick={() => _deleteAll()} label='Clear All' />
        </VStackRow>

      </VStack>

      <div className='UIAccountsListScroller'>
        <AccountsList />
        <Divider content='OR' />
        <EnterAsGuestButton />
      </div>

      <OnboardingModal opener={accountSetupOpener} />
      <ExportAccountModal opener={exportOpener} onImported={() => _deleteAll()} />
    </>
  )
}
