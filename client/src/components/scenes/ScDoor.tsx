import React, { useEffect, useState, useRef } from 'react'
import { VStack } from '/src/components/ui/Stack'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { useDojoStatus, useConnectToSelectedNetwork } from '@underware/pistols-sdk/dojo'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { ActionButton } from '/src/components/ui/Buttons'
import { Divider } from '/src/components/ui/Divider'
import { PACKAGE_VERSION } from '/src/utils/constants'
import { useAccount } from '@starknet-react/core'
import { useDuelistsOwnedByPlayer } from '/src/hooks/useTokenDuelists'
import { sceneBackgrounds, SceneName, TextureName } from '/src/data/assets'
import Logo from '/src/components/Logo'
import { Modal } from 'semantic-ui-react'
import { useTextureShift } from '/src/hooks/useTextureShift'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { AudioName } from '/src/data/audioAssets'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'

export default function ScDoor() {
  const { isReady } = useDojoStatus()
  const { hasFinishedTutorial } = useSettings()

  const [visibleChars, setVisibleChars] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { gameImpl } = useThreeJsContext()
  const soundTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { x: bubbleShiftX, y: bubbleShiftY } = useTextureShift(2)
  const { x: uiShiftX, y: uiShiftY } = useTextureShift(3)

  // clear tavern state
  useEffectOnce(() => {
    setIsLoading(false)
    setTimeout(() => {
      const scene = (_currentScene as InteractibleScene);
      if (scene) {
        scene.showItem(TextureName.bg_door_face_angry, true)
      }
    }, 50)
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

  useEffect(() => {
    if (isLoading) {
      const scene = (_currentScene as InteractibleScene);
      if (scene) {
        scene.hideItem(TextureName.bg_door_face_angry, true)
      }
    } else {
      const scene = (_currentScene as InteractibleScene);
      if (scene) {
        scene.showItem(TextureName.bg_door_face_angry, true)
      }
    }
  }, [isLoading])

  const playButtonHoverSound = (soundType: AudioName) => {
    // Clear any pending sound timeouts
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current)
    }

    // Stop any currently playing grunt sounds
    gameImpl?.stopAudio(AudioName.DOORKEEP_GRUNTING_1, 0.2)
    gameImpl?.stopAudio(AudioName.DOORKEEP_GRUNTING_2, 0.2)
    gameImpl?.stopAudio(AudioName.DOORKEEP_GRUNTING_3, 0.2)
    gameImpl?.stopAudio(AudioName.DOORKEEP_GRUNTING_4, 0.2)

    // Defer playing the new sound by 100ms
    soundTimeoutRef.current = setTimeout(() => {
      gameImpl?.playAudio(soundType)
    }, 150)
  }

  const playDoorCreakingSound = () => {
    gameImpl?.playAudio(AudioName.DOOR_CREAKING)
  }

  return (
    <div id='Door'>
      <div className='UIContainer' >
        <div className={`UIPage ${isLoading ? 'NoMouse NoDrag' : ''}`} style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s', position: 'absolute', transform: `translate(${uiShiftX}px, ${uiShiftY}px)` }}>
          <DoorHeader />
          <VStack className='NoPadding'>

            {isReady && <>
              {hasFinishedTutorial ? <>
                <div className='Spacer10' />
                <ConnectButton 
                  setLoading={setIsLoading} 
                  enterScene={SceneName.Tavern}
                  onButtonHover={() => playButtonHoverSound(AudioName.DOORKEEP_GRUNTING_1)}
                  onDoorCreak={playDoorCreakingSound}
                />
                <Divider content='OR' />  
                <EnterAsGuestButton 
                  onButtonHover={() => playButtonHoverSound(AudioName.DOORKEEP_GRUNTING_4)}
                  onDoorCreak={playDoorCreakingSound}
                />
                <div className='Spacer10' />
              </> : <>
                <Divider content='EXISTING PLAYERS:' />
                <div className='Spacer10' />
                <ConnectButton 
                  setLoading={setIsLoading} 
                  onButtonHover={() => playButtonHoverSound(AudioName.DOORKEEP_GRUNTING_1)}
                  onDoorCreak={playDoorCreakingSound}
                />
                <div className='Spacer20' />
                <Divider content='NEW PLAYERS:' />
                <div className='Spacer10' />
                <ConnectButton 
                  setLoading={setIsLoading} 
                  enterScene={SceneName.Tutorial}
                  label='Play Tutorial'
                  onButtonHover={() => playButtonHoverSound(AudioName.DOORKEEP_GRUNTING_3)}
                  onDoorCreak={playDoorCreakingSound}
                />
                <Divider content='OR' as='h5' className='DividerSmall' />
                <EnterAsGuestButton
                  onButtonHover={() => {
                    playButtonHoverSound(AudioName.DOORKEEP_GRUNTING_4);
                    (_currentScene as InteractibleScene)?.hideItem(TextureName.bg_door_face_angry, true)
                  }}
                  onButtonLeave={() => (_currentScene as InteractibleScene)?.showItem(TextureName.bg_door_face_angry, true)}
                  onDoorCreak={playDoorCreakingSound}
                />
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
          top: '60%',
          width: '30%',
          transform: `translate(${bubbleShiftX}px, ${bubbleShiftY}px)`
        }}
      >
        <img src="/images/ui/tavern/bubble_door.png" style={{ width: '100%' }} />
        <div className='SpeechContainer'>
          {visibleChars.map((char, i) => (
            <span key={i}>{char}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TutorialPromptModal() {
  const { tutorialPromptOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const onChoice = (playTutorial: boolean) => {
    tutorialPromptOpener.close()
    if (playTutorial) {
      dispatchSetScene(SceneName.Tutorial)
    } else {
      dispatchSetScene(SceneName.Tavern)
    }
  }

  return (
    <Modal
      size="small"
      open={tutorialPromptOpener.isOpen}
      onClose={() => tutorialPromptOpener.close()}
    >
      <Modal.Header>
        <h2 className="Important" style={{ textAlign: 'center', margin: '0.5rem 0' }}>Welcome, Duelist!</h2>
      </Modal.Header>
      <Modal.Content style={{ padding: '1rem 2rem' }}>
        <div style={{ 
          textAlign: 'center', 
          margin: '1.5rem 0',
          lineHeight: '1.6',
          fontSize: '1.4rem'
        }}>
          This appears to be your first visit to Pistols at Dawn.
          <br />
          Would you like to learn the ropes?
        </div>
      </Modal.Content>
      <Modal.Actions style={{ display: 'flex' }}>
        <ActionButton 
          fill
          dimmed
          onClick={() => onChoice(false)}
          label="No, take me to the tavern"
        />
        <ActionButton
          fill
          important
          onClick={() => onChoice(true)}
          label="Yes, show me the tutorial"
        />
      </Modal.Actions>
    </Modal>
  )
}


function DoorHeader() {
  return (
    <VStack>
      <Logo showName vertical />

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

export function EnterAsGuestButton({
  onButtonHover,
  onButtonLeave,
  onDoorCreak
}: {
  onButtonHover?: () => void,
  onButtonLeave?: () => void,
  onDoorCreak?: () => void
}) {
  const { dispatchSetScene } = usePistolsScene()

  const _enterAsGuest = () => {
    onDoorCreak?.()
    dispatchSetScene(SceneName.Tavern)
  }

  return (
    <ActionButton
      large
      fill
      onClick={() => _enterAsGuest()}
      label='Enter as Guest'
      onMouseEnter={onButtonHover}
      onMouseLeave={onButtonLeave}
    />
  )
}

export function ConnectButton({
  setLoading,
  large = true,
  label = 'Enter Tavern',
  enterScene,
  onButtonHover,
  onDoorCreak
}: {
  setLoading?: (loading: boolean) => void,
  large?: boolean,
  label?: string,
  enterScene?: SceneName,
  onButtonHover?: () => void,
  onDoorCreak?: () => void
}) {
  const { isConnected, isConnecting } = useAccount()
  const { isLoading, isError } = useDojoStatus()
  const { connect } = useConnectToSelectedNetwork()

  const { duelistIds } = useDuelistsOwnedByPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)
  const { dispatchSetScene } = usePistolsScene()
  const { tutorialPromptOpener } = usePistolsContext()

  const canConnect = (!isLoading && !isError && !isConnecting && connect != null)
  
  const hasClickedButton = useRef(false)

  const _connect = () => {
    if (canConnect) {
      connect();
      setLoading?.(true)
    }
    hasClickedButton.current = true
  }

  const handleMouseEnter = () => {
    if (canConnect) {
      onButtonHover?.()
    }
  }

  useEffect(() => {
    let timeoutId;

    if (isConnected && hasClickedButton.current && !isError) {
      if (enterScene) {
        onDoorCreak?.()
        dispatchSetScene(enterScene)
      } else {
        timeoutId = setTimeout(() => {
          if (canClaimStarterPack) {
            tutorialPromptOpener.open()
          } else {
            onDoorCreak?.()
            dispatchSetScene(SceneName.Tavern)
          }
        }, 1000)
      } 
    } else {
      setLoading?.(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

  }, [isConnected, isError, canClaimStarterPack, hasClickedButton.current, enterScene])

  return (
    <ActionButton 
      fill 
      large={large} 
      important 
      disabled={!canConnect} 
      onClick={() => _connect()} 
      label={label} 
      onMouseEnter={handleMouseEnter}
    />
  )
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
  if (isError || errorMessage) {
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
