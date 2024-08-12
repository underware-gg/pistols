import React from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain, useConnectToSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { makeTavernUrl } from '@/pistols/utils/pistols'
import { PACKAGE_VERSION } from '@/pistols/utils/constants'
import UIContainer from '@/pistols/components/UIContainer'
import Logo from '@/pistols/components/Logo'

const Row = Grid.Row
const Col = Grid.Column


export default function Gate() {
  const { dispatchSelectDuel } = usePistolsContext()

  // clear tavern state
  useEffectOnce(() => {
    dispatchSelectDuel(0n)
  }, [])

  return (
    <div id='Gate'>
      <UIContainer>
        <GateHeader />

        <GateMenu />

      </UIContainer>

      <CurrentChainHint />
    </div>
  )
}

function GateHeader() {
  return (
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
    </VStack>
  )
}

export function CurrentChainHint() {
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
function GateMenu() {
  const router = useRouter()
  const { tableId } = useSettings()
  const { isConnecting } = useSelectedChain()
  const { isLoading, loadingMessage, isError, errorMessage } = useDojoStatus()
  
  const _onConnect = () => {
    router.push(makeTavernUrl(tableId))
  }

  return (
    <VStack className='NoPadding'>
      <Divider />

      <ActionButton fill large important disabled={true} onClick={() => { }} label={'Play Tutorial'} />
      <Divider content='OR' />
      <ConnectButton onConnect={_onConnect} />
      <Divider content='OR' />
      <EnterAsGuestButton />

      <ConnectStatus />

    </VStack>
  )
}


export function EnterAsGuestButton() {
  const router = useRouter()
  const { tableId, dispatchDuelistId } = useSettings()
  const _enterAsGuest = () => {
    dispatchDuelistId(0n)
    router.push(makeTavernUrl(tableId))
  }
  return <ActionButton fill large onClick={() => _enterAsGuest()} label='Enter as Guest' />
}


export function ConnectButton({
  onConnect,
}: {
  onConnect?: Function
}) {
  const { isConnecting } = useSelectedChain()
  const { isLoading, isError } = useDojoStatus()
  const { connect } = useConnectToSelectedChain(() => {
    onConnect?.()
  })

  const canConnect = (!isLoading && !isError && !isConnecting && connect != null)
  // const switchChain = (isConnected && !isCorrectChain)

  const _connect = () => {
    if (canConnect) {
      connect()
    }
  }

  return <ActionButton fill large important disabled={!canConnect} onClick={() => _connect()} label={'Connect / Create Account'} />
}


export function ConnectStatus() {
  const { isConnecting } = useSelectedChain()
  const { isLoading, loadingMessage, isError, errorMessage } = useDojoStatus()
  return (
    <>
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
    </>
  )
}



