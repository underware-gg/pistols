import React from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useAccount } from '@starknet-react/core'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain, useConnectToSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useCanMintDuelist } from '../hooks/useTokenDuelist'
import { ChainSwitcher } from '@/lib/dojo/ChainSwitcher'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { makeTavernUrl } from '@/pistols/utils/pistols'
import { PACKAGE_VERSION } from '@/pistols/utils/constants'
import UIContainer from '@/pistols/components/UIContainer'
import OnboardingModal from '@/pistols/components/account/OnboardingModal'
import Logo from '@/pistols/components/Logo'
import { EnterAsGuestButton } from './Gate'
import WalletHeader from './account/WalletHeader'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountPanel() {
  const { isConnected, isConnecting, isCorrectChain } = useSelectedChain()
  const { isLoading, isError } = useDojoStatus()

  const { dispatchSelectDuel } = usePistolsContext()

  // cler tavern state
  useEffectOnce(() => {
    dispatchSelectDuel(0n)
  }, [])

  return (
    <div id='Gate'>
      <UIContainer>

        <VStack>

          <WalletHeader />

        </VStack>

        <ConnectedGate />

      </UIContainer>

      <CurrentChain />
    </div>
  )
}

export function CurrentChain() {
  const { selectedChainId } = useSelectedChain()
  return (
    <div className='Code Disabled AbsoluteRight Padded'>
      {selectedChainId}
    </div>
  )
}


//----------------------------------
// Connected Gate
//

function ConnectedGate() {
  const { accountSetupOpener, dispatchSetAccountMenu } = usePistolsContext()
  const { tableId, dispatchDuelistId } = useSettings()
  const { address } = useAccount()
  const { canMint } = useCanMintDuelist(address)

  const _mintDuelist = () => {
    dispatchDuelistId(0n)
    dispatchSetAccountMenu(AccountMenuKey.Profile)
    accountSetupOpener.open()
  }

  return (
    <>
      <VStack>

        <VStackRow>
          <ActionButton fill disabled={!canMint} onClick={() => _mintDuelist()} label='Mint New Duelist' />
        </VStackRow>

      </VStack>

      <div className='UIAccountsListScroller'>
        <AccountsList />
        <Divider content='OR' />
        <EnterAsGuestButton />
      </div>

      <OnboardingModal opener={accountSetupOpener} />
    </>
  )
}
