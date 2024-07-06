import React from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { ChainSwitcher } from '@/lib/dojo/ChainSwitcher'
import { AccountMenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { AccountsList } from '@/pistols/components/account/AccountsList'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { LordsBagIcon } from '@/pistols/components/account/Balance'
import { Divider } from '@/lib/ui/Divider'
import { makeTavernUrl } from '@/pistols/utils/pistols'
import { PACKAGE_VERSION } from '@/pistols/utils/constants'
import OnboardingModal from '@/pistols/components/account/OnboardingModal'
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
            <br />
            Settle Your Grudges Honourably
            <br />Wager some <LordsBagIcon /><b>LORDS</b> or practice for free
            <br />But remember... Don't lose your hat!
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
      <Divider />
      <Grid>
        <Row columns={'equal'}>
          <Col>
            <ChainSwitcher fluid disabled={isLoading} />
          </Col>
          <Col>
            <ActionButton fill large important disabled={!canConnect || isConnecting} onClick={() => connectOpener.open()} label={switchChain ? 'Switch Chain' : 'Connect Wallet'} />
          </Col>
        </Row>
      </Grid>
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


function EnterAsGuestButton() {
  const { tableId, dispatchDuelistId } = useSettings()
  const router = useRouter()

  const _enterAsGuest = () => {
    dispatchDuelistId(0n)
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
  const { accountSetupOpener, dispatchSetAccountMenu } = usePistolsContext()

  const _mintDuelist = () => {
    dispatchSetAccountMenu(AccountMenuKey.Profile)
    accountSetupOpener.open()
  }

  return (
    <>
      <VStack>

        <VStackRow>
          <ActionButton fill onClick={() => _mintDuelist()} label='Mint New Duelist' />
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
