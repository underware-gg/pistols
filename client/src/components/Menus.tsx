import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Label, Menu, SemanticICONS } from 'semantic-ui-react'
import { usePistolsScene, usePistolsContext } from '/src/hooks/PistolsContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { IconClick } from '/src/components/ui/Icons'
import { makeDuelDataUrl } from '/src/utils/pistols'
import * as TWEEN from '@tweenjs/tween.js'
import { AnimationState } from '../three/game'
import { useGameplayContext } from '../hooks/GameplayContext'

export function MenuDuel({
  duelId,
} : {
  duelId: bigint
}) {
  const { dispatchSetDuel, tutorialOpener, settingsOpener } = usePistolsContext()
  const { dispatchSceneBack } = usePistolsScene()
  const { dispatchAnimated } = useGameplayContext()
  
  const _backToTavern = () => {
    dispatchAnimated(AnimationState.None)
    dispatchSceneBack()
    dispatchSetDuel(0n)
  }

  const _openSettings = () => {
    settingsOpener.open()
  }

  const _openTutorial = () => {
    tutorialOpener.open()
  }

  return (
    <div className='MenuBottomDuel AlignCenter NoMouse'>
      <div className='MenuBottomBackground NoDrag NoMouse'>
        <img className='MenuBackgroundImage' src='/images/ui/duel/bottom_nav.png'/>
      </div>
      <Menu secondary compact className='YesMouse' size='huge' style={{ minHeight: '0', position: 'relative' }}>
        <Menu.Item className='button_duel' type='tavern' onClick={() => _backToTavern()}>
          Back to Tavern
        </Menu.Item>

        <Menu.Item className='button_duel' type='help' onClick={() => _openTutorial()}>
          Help
        </Menu.Item>

        <Menu.Item className='button_duel' type='icon'>
          <IconClick name='database' onClick={() => window?.open(makeDuelDataUrl(duelId), '_blank')} className='icon-control' />
        </Menu.Item>

        <Menu.Item className='button_duel' type='icon'>
          <IconClick name={'settings'} onClick={() => _openSettings()} className='icon-control'  />
        </Menu.Item>



        {/* <Menu.Item disabled={!canSkip} onClick={() => _skipAnimation()}>
          Skip animation
        </Menu.Item> */}

        {/* <SettingsMenuItem prefix='SFX' settingsKey={SettingsActions.SFX_ENABLED} currentValue={settings.sfxEnabled} /> */}

      </Menu>
    </div>
  )
}

const ControlMenuItem = React.memo(({ 
  icon, 
  onClick, 
  tooltip, 
  children 
}: {
  icon?: string;
  onClick?: () => void;
  tooltip?: string;
  children?: React.ReactNode;
}) => {
  const [tooltipOpacity, setTooltipOpacity] = useState(0);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tweenRef = useRef<TWEEN.Tween<{opacity: number}> | null>(null);

  useEffect(() => {
    // This effect runs when the component mounts
    if (process.env.NODE_ENV !== 'production') {
      console.log('MenuDuelControl mounted');
    }
    
    return () => {
      // This cleanup function runs when the component unmounts
      if (process.env.NODE_ENV !== 'production') {
        console.log('MenuDuelControl unmounted');
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    if (tweenRef.current) {
      tweenRef.current.stop();
    }
    
    const tween = new TWEEN.Tween({ opacity: 0 })
      .to({ opacity: 1 }, 300)
      .onUpdate(obj => setTooltipOpacity(obj.opacity))
      .delay(400)
      .start();
    
    tweenRef.current = tween;
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    if (tweenRef.current) {
      tweenRef.current.stop();
      tweenRef.current = null;
    }
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    
    leaveTimeoutRef.current = setTimeout(() => {
      const tween = new TWEEN.Tween({ opacity: tooltipOpacity })
        .to({ opacity: 0 }, 200)
        .onUpdate(obj => setTooltipOpacity(obj.opacity))
        .onComplete(() => {
          tweenRef.current = null;
        })
        .start();
      
      tweenRef.current = tween;
    }, 200);
  }, [tooltipOpacity]);
  
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      if (tweenRef.current) {
        tweenRef.current.stop();
      }
    };
  }, []);
  
  return (
    <Menu.Item className='button_duel' type='icon-vertical'>
      <div className='Relative'>
        <Label 
          pointing='right' 
          className='NoMouse NoDrag'
          style={{ 
            position: 'absolute', 
            top: '-120%', 
            right: '180%', 
            opacity: tooltipOpacity,
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {tooltip}
        </Label>
        <IconClick 
          name={icon as SemanticICONS} 
          onClick={onClick} 
          className='icon-control'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      {children}
    </Menu.Item>
  );
});

export function MenuDuelControl({
  clickPlay,
  clickStep,
  clickReset,
  isPlaying
}) {
  const { dispatchSetting, settings, SettingsActions } = useSettings()

  useEffect(() => {
    // This effect runs when the component mounts
    if (process.env.NODE_ENV !== 'production') {
      console.log('MenuDuelControl mounted');
    }
    
    return () => {
      // This cleanup function runs when the component unmounts
      if (process.env.NODE_ENV !== 'production') {
        console.log('MenuDuelControl unmounted');
      }
    };
  }, []);

  const _switchSpeedFactor = useCallback(() => {
    const newSpeed = settings.duelSpeedFactor + 0.5
    dispatchSetting(SettingsActions.DUEL_SPEED_FACTOR, newSpeed > 2.0 ? 0.5 : newSpeed)
  }, [settings.duelSpeedFactor, dispatchSetting]);

  // Memoize the menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => (
    <>
      <ControlMenuItem 
        icon='angle double right' 
        onClick={_switchSpeedFactor} 
        tooltip="Change playback speed"
      >
        <div>{settings.duelSpeedFactor}</div>
      </ControlMenuItem>

      <ControlMenuItem 
        icon={isPlaying ? 'pause' : 'play'} 
        onClick={clickPlay} 
        tooltip={`${isPlaying ? 'Pause' : 'Play'} animation`}
      />

      <ControlMenuItem 
        icon='plus' 
        onClick={clickStep} 
        tooltip="Step forward"
      />

      <ControlMenuItem 
        icon='redo' 
        onClick={clickReset} 
        tooltip="Reset animation"
      />
    </>
  ), [isPlaying, settings.duelSpeedFactor, _switchSpeedFactor, clickPlay, clickStep, clickReset]);

  return (
    <div className='MenuRightDuel NoMouse'>
      <div className='MenuRightBackground NoDrag NoMouse'>
        <img className='MenuBackgroundImageFliped' src='/images/ui/duel/side_nav.png'/>
      </div>
      <Menu secondary compact vertical className='YesMouse' size='huge' style={{ minHeight: '0' }}>
        {menuItems}
      </Menu>
    </div>
  )
}
