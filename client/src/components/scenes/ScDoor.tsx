import React, { useEffect, useState } from 'react'
import { VStack } from '/src/components/ui/Stack'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { useDojoStatus, useConnectToSelectedNetwork } from '@underware/pistols-sdk/dojo'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { ActionButton } from '/src/components/ui/Buttons'
import { Divider } from '/src/components/ui/Divider'
import { PACKAGE_VERSION } from '/src/utils/constants'
import { useAccount } from '@starknet-react/core'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { SceneName } from '/src/data/assets'
import Logo from '/src/components/Logo'

export default function ScDoor() {
  const { isReady } = useDojoStatus()
  const { hasFinishedTutorial } = useSettings()

  const [visibleChars, setVisibleChars] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // clear tavern state
  useEffectOnce(() => {
    setIsLoading(false)
  }, [])

  useEffectOnce(() => {
    const message = "Identify yourself!"
    
    const addCharacter = (index: number) => {
      if (index < message.length) {
        setVisibleChars(prev => [...prev, message[index]])
        setTimeout(() => addCharacter(index + 1), 80)
      }
    }

    addCharacter(0)
  }, [])

  return (
    <div id='Door'>
      <div className='UIContainer' >
        <div className={`UIPage ${!isLoading ? '' : 'NoMouse NoDrag'}`} style={{ opacity: !isLoading ? 1 : 0, transition: 'opacity 0.5s', position: 'absolute' }}>
          <DoorHeader />
          <VStack className='NoPadding'>

            {isReady && <>
              {hasFinishedTutorial ? <>
                <div className='Spacer10' />
                <ConnectButton setLoading={setIsLoading} />
                <Divider content='OR' />  
                <EnterAsGuestButton />
                <div className='Spacer10' />
              </> : <>
                <Divider content='NEW PLAYERS:' />
                <div className='Spacer10' />
                <PlayGameButton />
                <Divider content='OR' as='h5' className='DividerSmall'/>
                <EnterAsGuestButton />
                <div className='Spacer30' />
                <Divider content='EXISTING PLAYERS:' />
                <div className='Spacer10' />
                <ConnectButton setLoading={setIsLoading} />
              </>}
            </>}

          </VStack>
        </div>

        <div className={`UIPage ${isLoading ? '' : 'NoMouse NoDrag'}`} style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.5s', position: 'absolute' }}>
          <ConnectStatus />
        </div>
        
      </div>

      <div
        className="NoMouse NoDrag NoSelection"
        style={{
          position: 'absolute',
          left: '1%',
          top: '55%',
          width: '30%',
        }}
      >
        <img src="/images/ui/tavern/bubble_door.png" style={{ width: '100%' }}/>
        <div className='SpeechContainer'> 
          {visibleChars.map((char, i) => (
            <span key={i}>{char}</span>
          ))}
        </div>
      </div>
    </div>
  )
}


function DoorHeader() {
  return (
    <VStack>
      <Logo showName vertical/>

      <div className='Spacer10' />
      <div className='H5 TitleCase'>
        An <a href='https://underware.gg'>Underware</a> Game
      </div>

      <div className='Spacer10' />
      <div className='Code Disabled'>
        version {PACKAGE_VERSION}
      </div>

      <div className='Spacer10' />
    </VStack>
  )
}

export function EnterAsGuestButton() {
  const { dispatchSetScene } = usePistolsScene()

  const _enterAsGuest = () => {
    dispatchSetScene(SceneName.Tavern)
  }
  return <ActionButton large fill onClick={() => _enterAsGuest()} label='Enter as Guest' />
}

export function PlayGameButton({
  large = true,
}: {
  large?: boolean
}) {
  const { dispatchSetScene } = usePistolsScene()

  const _playGame = () => {
    dispatchSetScene(SceneName.Tutorial)
  }
  return <ActionButton large={large} fill important onClick={() => _playGame()} label='Start Tutorial' />
}

export function ConnectButton({
  setLoading,
  large = true,
}: {
  setLoading?: (loading: boolean) => void,
  large?: boolean
}) {
  const { isConnected, isConnecting } = useAccount()
  const { isLoading, isError } = useDojoStatus()
  const { connect } = useConnectToSelectedNetwork()
  
  const { duelistIds } = useDuelistsOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)
  const { dispatchSetScene } = usePistolsScene()

  const canConnect = (!isLoading && !isError && !isConnecting && connect != null)
  // const switchChain = (isConnected && !isCorrectChain)

  const _connect = () => {
    if (canConnect) {
      connect()
      setLoading?.(true)
    }
  }

  useEffect(() => {
    let timeoutId;

    if (isConnected && !isError) {
      timeoutId = setTimeout(() => {
        if (canClaimStarterPack) {
          dispatchSetScene(SceneName.Tutorial)
        } else {
          dispatchSetScene(SceneName.Tavern)
        }
      }, 1000)
    } else if (isError) {
      setLoading?.(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

  }, [isConnected, isError, canClaimStarterPack])

  return <ActionButton fill large={large} important disabled={!canConnect} onClick={() => _connect()} label={'Enter as Patron'} />
}

export function ConnectStatus() {
  const { isConnecting } = useAccount()
  const { isLoading, loadingMessage, isError, errorMessage } = useDojoStatus()

  if (isConnecting) {
    return <h1 className='TitleCase Important'>Connecting...</h1>
  }
  if (isLoading) {
    return <h1 className='TitleCase Important'>{loadingMessage}</h1>
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
  return <h1>Connecting...</h1>
}
