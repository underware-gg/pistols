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
    <>
      <UIContainer>

        <VStack>
          <Logo />

          <h1>Pistols at Ten Blocks</h1>

          <div className='H5 TitleCase'>
            An <a href='https://underware.gg'>Underware</a> Game
          </div>

          <div className='Code Disabled'>
            v{PACKAGE_VERSION}
          </div>

          <hr />

          <span className='Title'>
            Settle Your Grudges Honourably
          </span>


          {/* <WalletHeader /> */}

        </VStack>

        <DisconnectedGate />

      </UIContainer>

      <CurrentChain />
    </>
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
// Disconnected Gate
//
function DisconnectedGate() {
  const router = useRouter()
  const { tableId } = useSettings()
  // const { connectOpener } = usePistolsContext()
  const { isConnected, isConnecting, isCorrectChain } = useSelectedChain()
  const { isLoading, loadingMessage, isError, errorMessage } = useDojoStatus()
  const { connect } = useConnectToSelectedChain(() => {
    router.push(makeTavernUrl(tableId))
  })

  const canConnect = (!isLoading && !isError && !isConnecting && connect != null)
  // const switchChain = (isConnected && !isCorrectChain)

  const _connect = () => {
    if (canConnect) {
      connect()
    }
  }

  return (
    <VStack>
      <Divider />
      <Grid>
        {/* <Row columns={'equal'}>
          <Col>
            <ChainSwitcher fluid disabled={isLoading} />
          </Col>
          <Col>
            <ActionButton fill large important disabled={!canConnect} onClick={() => connectOpener.open()} label={switchChain ? 'Switch Chain' : 'Connect Wallet'} />
          </Col>
        </Row> */}

        <Row columns={'equal'} className='NoPadding'>
          <Col>
            <ActionButton fill large important disabled={true} onClick={() => { }} label={'Play Tutorial'} />
          </Col>
        </Row>

        <Row columns={'equal'} className='NoPadding'>
          <Col>
            <Divider content='OR' />
          </Col>
        </Row>

        <Row columns={'equal'} className='NoPadding'>
          <Col>
            <ActionButton fill large important disabled={!canConnect} onClick={() => _connect()} label={'Connect Or Create Account'} />
          </Col>
        </Row>

        <Row columns={'equal'} className='NoPadding'>
          <Col>
            <Divider content='OR' />
          </Col>
        </Row>

        <Row columns={'equal'} className='NoPadding'>
          <Col>
            <EnterAsGuestButton />
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
            : <></>
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
