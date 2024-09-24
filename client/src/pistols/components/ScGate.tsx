import React from 'react'
import { Grid } from 'semantic-ui-react'
import { VStack } from '@/lib/ui/Stack'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain, useConnectToSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { PACKAGE_VERSION } from '@/pistols/utils/constants'
import Logo from '@/pistols/components/Logo'
import { useIsMyDuelist } from '../hooks/useIsYou'

const Row = Grid.Row
const Col = Grid.Column

export default function ScGate() {
  const { dispatchSelectDuel } = usePistolsContext()

  // clear tavern state
  useEffectOnce(() => {
    dispatchSelectDuel(0n)
  }, [])

  return (
    <div id='Gate'>
      <div className='UIContainer'>
        <GateHeader />
        <GateMenu />
      </div>

      <CurrentChainHint />
    </div>
  )
}

function GateHeader() {
  return (
    <VStack>
      <Logo />

      <h1>Pistols at Ten Blocks</h1>

      <div className='Spacer5' />
      <div className='H5 TitleCase'>
        An <a href='https://underware.gg'>Underware</a> Game
      </div>

      <div className='Spacer10' />
      <div className='Code Disabled'>
        version {PACKAGE_VERSION}
      </div>

      <div className='Spacer10' />
      <hr />

      <div className='Spacer10' />
      <span className='Title'>
        Settle Your Grudges Honourably
      </span>
    </VStack>
  )
}

export function CurrentChainHint() {
  const { selectedChainId } = useSelectedChain()
  return (
    <div className='Code Disabled AbsoluteBottom Padded'>
      {selectedChainId}
    </div>
  )
}


//----------------------------------
// Disconnected Gate
//
function GateMenu() {
  const { dispatchDuelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistId } = useSettings()
  const isMyDuelist = useIsMyDuelist(duelistId)
  const { isReady } = useDojoStatus()

  const _onConnect = () => {
    if (isMyDuelist) {
      dispatchSetScene(SceneName.Tavern)
    } else {
      dispatchDuelistId(0n)
      dispatchSetScene(SceneName.Profile)
    }
  }

  return (
    <VStack className='NoPadding'>
      <hr />
      <Divider hidden />

      {isReady && <>
        <ActionButton fill large important disabled={true} onClick={() => { }} label={'Play Tutorial'} />
        <Divider content='OR' />
        <ConnectButton onConnect={_onConnect} />
        <Divider content='OR' />
        <EnterAsGuestButton />
      </>}

      <ConnectStatus />

    </VStack>
  )
}


export function EnterAsGuestButton() {
  const { dispatchDuelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()

  const _enterAsGuest = () => {
    dispatchDuelistId(0n)
    dispatchSetScene(SceneName.Tavern)
  }
  return <ActionButton large fill onClick={() => _enterAsGuest()} label='Enter as Guest' />
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

  if (isConnecting) {
    return <h3 className='TitleCase Important'>Connecting...</h3>
  }
  if (isLoading) {
    return <h3 className='TitleCase Important'>{loadingMessage}</h3>
  }
  if (isError) {
    return (
      <div>
        <h3 className='TitleCase Negative'>{errorMessage}</h3>
        <Divider hidden />
        <ActionButton fill large important onClick={() => location.reload()} label='Retry' />
      </div>
    )
  }
  return <></>
}



