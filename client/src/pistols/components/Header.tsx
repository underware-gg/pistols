import React, { useCallback, useEffect, useState } from 'react'
import { Grid, Dropdown, Image } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { BackButton, MusicToggle } from '@/pistols/components/ui/Buttons'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import useGameAspect from '../hooks/useGameApect'
import * as TWEEN from '@tweenjs/tween.js'
import { SCENE_CHANGE_ANIMATION_DURATION } from '../three/game'
import WalletHeader from './account/WalletHeader'
import { useAccount, useDisconnect } from '@starknet-react/core'


function useExit() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { dispatchSetScene } = usePistolsScene()
  const exit = useCallback(() => {
    if (isConnected) {
      disconnect()
    }
    dispatchSetScene(SceneName.Gate)
  }, [isConnected, disconnect, dispatchSetScene])
  return {
    exit,
  }
}

export function Header() {

  const { tableId } = useSettings()
  const { tableOpener } = usePistolsContext()
  const { description } = useTable(tableId)

  const { atDuel, atGate, atDoor, atProfile, atTavern } = usePistolsScene()
  const { aspectWidth } = useGameAspect()

  const _changeTable = () => {
    tableOpener.open()
  }

  if (atDuel) {
    return <></>
  }

  return (
    <>
      {!atGate && !atDoor &&
        <>
          <div className='UIHeader NoMouse NoDrag NoSelection' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <CurtainUI visible={!atTavern} short={true} />
            <BannerButton button={<MusicToggle size='big' />} visible={atTavern} />
          </div>
          <Image className='NoMouse NoDrag NoSelection' src='/images/ui/tavern/wooden_corners.png' style={{ position: 'absolute' }} />
          <div className='NoMouse NoDrag UIHeader NoSelection' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className='Padded' style={{ flex: '1' }}>
              {!atTavern && 
                <div className='YesMouse' style={{ padding: aspectWidth(1.4) }}>
                  <BackButton />
                </div>
              }
            </div>
            <div className='TitleCase NoBreak Relative' style={{ flex: '1', textAlign: 'center', height: '1px' }}>
              {/* {showTable && <>
                <h1>Pistols at 10 Blocks</h1>
                <p className='AlignTop'>
                  <IconClick name='ticket' size={'big'} onClick={() => _changeTable()} style={{ marginBottom: '0.4em' }} />
                  {' '}<b className='Important H3 Anchor' onClick={() => _changeTable()}>{description}</b>
                </p>
              </>} */}
              {/* //TODO add table name when needed */}
            </div>
            <div className='YesMouse' style={{ flex: '1', textAlign: 'right' }}>
              {!atProfile &&
                <AccountHeader />
              }
            </div>
          </div>
        </>
      }

      {/* door and gate UI */}
      <>
        <BannerButton button={<BackButton />} visible={atDoor} short={true} />
        <BannerButton button={<MusicToggle size='big'/>} right={true} visible={atGate || atDoor} short={true} />
      </>
    </>
  )
}

function BannerButton({
  button,
  right = false,
  short = false,
  visible = false,
}: {
  button: any
  right?: boolean
  short?: boolean
  visible?: boolean
}) {

  const { aspectWidth } = useGameAspect()
  
  const [ offset, setOffset ] = useState(-16)
  
  useEffect(() => {
    if (visible) {
      new TWEEN.Tween({ offset })
        .to({ offset: short ? -4.5 : 0 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(100)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    } else {
      new TWEEN.Tween({ offset })
        .to({ offset: -16 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    }
  }, [visible, short])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', width: aspectWidth(10), height: 'auto', top: aspectWidth(offset), [right ? 'right' : 'left']: aspectWidth(2) }}>
      <Image className='NoMouse NoDrag' src='/images/ui/tavern/banner.png' />
      <div style={{ 
        width: aspectWidth(4), 
        height: aspectWidth(4), 
        position: 'absolute', 
        marginTop: aspectWidth(2), 
        alignContent: 'center', 
        textAlign: 'center',
        border: 'solid', 
        borderColor: '#f1d242', 
        borderWidth: `${aspectWidth(0.2)}px`,
        borderRadius: '500px', 
        backgroundColor: '#5f1011' 
      }}>
        {button}
      </div>
    </div>
  )
}

function CurtainUI({
  short = false,
  visible = false,
}: {
  short?: boolean
  visible?: boolean
}) {

  const { atDuel, atGate, atDoor, atProfile, atTavern } = usePistolsScene()
  const { aspectWidth } = useGameAspect()
  
  const [ offset, setOffset ] = useState(-18)
  
  useEffect(() => {
    if (visible) {
      new TWEEN.Tween({ offset })
        .to({ offset: short ? -8 : 0 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(100)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    } else {
      new TWEEN.Tween({ offset })
        .to({ offset: -18 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    }
  }, [visible, short])

  return (
    <div style={{ position: 'absolute', top: aspectWidth(offset) }}>
      <Image className='NoMouse NoDrag NoSelection' src='/images/ui/tavern/curtain.png' />
      <div className='YesMouse' style={{ position: 'absolute', top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: aspectWidth(2) }}>
        {atProfile && <div className=''>
          <WalletHeader />
        </div>}
      </div>
    </div>
  )
}
