import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FormInput, Grid } from 'semantic-ui-react'
import { VStack } from '@/components/ui/Stack'
import { useEffectOnce } from '@underware_gg/pistols-sdk/hooks'
import { useDojoStatus, useDojoSystemCalls, useSelectedChain, useConnectToSelectedChain } from '@underware_gg/pistols-sdk/dojo'
import { useSettings } from '@/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '@/hooks/PistolsContext'
import { useGameAspect } from '@/hooks/useGameApect'
import { ActionButton } from '@/components/ui/Buttons'
import { Divider } from '@/components/ui/Divider'
import { PACKAGE_VERSION, PROFILE_PIC_COUNT } from '@/utils/constants'
import { useIsMyDuelist } from '@/hooks/useIsYou'
import { useAccount } from '@starknet-react/core'
import { useDuelistsOfPlayer, useNextRandomProfilePic } from '@/hooks/useDuelistToken'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { IconClick } from '@/components/ui/Icons'
import { ProfilePic } from '@/components/account/ProfilePic'
import { SceneName } from '@/data/assets'
import Logo from '@/components/Logo'

const Row = Grid.Row
const Col = Grid.Column

export default function ScDoor() {
  const { account, address, isConnected } = useAccount()

  const { create_duelist } = useDojoSystemCalls()
  const { dispatchSelectDuel } = usePistolsContext()
  const { dispatchDuelistId, duelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistIds } = useDuelistsOfPlayer()
  const isMyDuelist = useIsMyDuelist(duelistId)

  const { isReady } = useDojoStatus()
  
  const [visibleChars, setVisibleChars] = useState<string[]>([])
  const [isFirstDivVisible, setIsFirstDivVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isDuelistBeingCreated, setIsDuelistBeingCreated] = useState(false)
  
  const [selectedProfilePic, setSelectedProfilePic] = useState(0)
  const [inputName, setInputName] = useState('')

  const { aspectWidth } = useGameAspect()

  const { randomPic } = useNextRandomProfilePic()
  const _profilePic = useMemo(() => (selectedProfilePic || randomPic), [selectedProfilePic, randomPic])

  const duelists = useRef<bigint[]>(duelistIds)

  const inputIsValid = inputName.length >= 3

  // clear tavern state
  useEffectOnce(() => {
    dispatchSelectDuel(0n)
    setIsFirstDivVisible(true)
    setIsLoading(false)
    
    // setIsEntryLoading(true)
    // disconnect()
    // setTimeout(() => {
    //   setIsEntryLoading(false)
    // }, 200)
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

  let timeoutId;
  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    console.log("CONNECTED", isConnected, isMyDuelist, duelistIds.length)
    if (isConnected) {
      setIsLoading(true)
      timeoutId = setTimeout(() => {
        if (isMyDuelist) {
          dispatchSetScene(SceneName.Tavern)
        } else if (duelists.current.length > 0) {
          dispatchDuelistId(duelists.current[0])
          dispatchSetScene(SceneName.Tavern)
        } else {
          setIsLoading(false)
          setIsFirstDivVisible(false)
        }
      }, 1000)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

  }, [isConnected])

  const _submit = async () => {
    if (inputIsValid) {
      setIsDuelistBeingCreated(true)
      await create_duelist(account, address, inputName, constants.ProfilePicType.Duelist, _profilePic.toString())
      // dispatchSetScene(SceneName.Tavern)
    }
  }

  useEffect(() => {
    duelists.current = duelistIds
    console.log('isDuelistBeingCreated', isDuelistBeingCreated, duelistIds)
    if (isDuelistBeingCreated && duelistIds.length > 0) {
      dispatchDuelistId(duelistIds[duelistIds.length - 1])
      dispatchSetScene(SceneName.Tavern)
      setIsDuelistBeingCreated(false)
    }
  }, [duelistIds])

  return (
    <div id='Door'>
      <div className='UIContainer' >
        <div className={`UIPage ${isFirstDivVisible && !isLoading ? '' : 'NoMouse NoDrag'}`} style={{ opacity: isFirstDivVisible && !isLoading ? 1 : 0, transition: 'opacity 0.5s', position: 'absolute' }}>
          <DoorHeader />
          <VStack className='NoPadding'>

            {isReady && <>
              <ConnectButton />
              <Divider content='OR' />
              <EnterAsGuestButton />
            </>}

            <ConnectStatus />

          </VStack>
        </div>

        <div className={`UIPage ${isLoading ? '' : 'NoMouse NoDrag'}`} style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.5s', position: 'absolute' }}>
          <h1>Loading...</h1>
        </div>
        
        <div className={`UIPage ${!isFirstDivVisible && !isLoading ? '' : 'NoMouse NoDrag'}`} style={{ opacity: !isFirstDivVisible && !isLoading ? 1 : 0, transition: 'opacity 0.5s', position: 'absolute' }}>
          <div style={{ marginTop: aspectWidth(8), marginBottom: aspectWidth(4), textAlign: 'center' }}>
            <h1 style={{marginBottom: aspectWidth(3), textAlign: 'center' }}>Create Your Duelist</h1>
            <FormInput
              placeholder={'Duelist Name'} 
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              maxLength={31}
              disabled={!account || !address}
              style={{width: '100%', backgroundColor: 'transparent'}}
            />
            
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              marginTop: '20px'
            }}>
              <IconClick name='angle double left' size={'huge'} important
                onClick={() => setSelectedProfilePic(selectedProfilePic === 0 ? PROFILE_PIC_COUNT - 1 : selectedProfilePic - 1)}
              />
              <ProfilePic profilePic={_profilePic} className='AutoHeight NoBorder DuelistImageSelect' />
              <IconClick name='angle double right' size={'huge'} important
                onClick={() => setSelectedProfilePic((selectedProfilePic + 1 % PROFILE_PIC_COUNT))}
              />
            </div>
          </div>
          <ActionButton large fill important disabled={!inputIsValid} onClick={_submit} label='Create Duelist' />
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
        

      <CurrentChainHint />
    </div>
  )
}

export function CurrentChainHint() {
  const { selectedChainId } = useSelectedChain()
  return (
    <>
      <div className='Code Disabled AbsoluteBottomRight Padded AlignRight'>
        v{PACKAGE_VERSION}
        <br />
        {selectedChainId}
      </div>
    </>
  )
}


function DoorHeader() {
  return (
    <VStack>
      <Logo />

      <h1>Pistols at Dawn</h1>

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
