import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Menu, Button, Confirm, SemanticICONS, Icon } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useLordsBalance } from '@underware/pistols-sdk/dojo'
import { LordsBagIcon } from '/src/components/account/Balance'
import { CustomIcon, IconSizeProp } from '/src/components/ui/Icons'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { usePact } from '/src/hooks/usePact'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { useTableId } from '/src/stores/configStore'

//-----------------
// Generic Action button
//

type ActionButtonProps = {
  label: string | ReactElement
  toggle?: boolean
  active?: boolean
  disabled?: boolean
  large?: boolean
  fill?: boolean
  fillParent?: boolean
  dimmed?: boolean
  important?: boolean
  negative?: boolean
  confirm?: boolean
  confirmMessage?: string
  className?: string
  onClick: () => void
}

export const ActionButton = ({
  label,
  toggle = false,
  active = false,
  disabled = false,
  large = false,
  fill = false,
  fillParent = false,
  dimmed = false,
  important = false,
  negative = false,
  confirm = false,
  confirmMessage = null,
  className = null,
  onClick,
}: ActionButtonProps) => {
  const classNames = useMemo(() => {
    let classNames = []
    if (important && !disabled) classNames.push('Important')
    if (fillParent) classNames.push('FillParent')
    if (large) classNames.push('LargeButton')
    classNames.push((disabled || dimmed) ? 'Locked' : 'Unlocked')
    if (negative) classNames.push('Negative')
    if (className) classNames.push(className)
    return classNames
  }, [className, important, disabled, large, dimmed, negative])

  const [isConfirming, setIsConfirming] = useState(false)
  const _click = () => {
    if (confirm) {
      if (!isConfirming) {
        setIsConfirming(true)
      } else {
        onClick()
        setIsConfirming(false)
      }
    } else {
      onClick()
    }
  }

  return (
    <>
      <Button
        className={classNames.join(' ')}
        fluid={fill}
        toggle={toggle}
        active={active}
        disabled={disabled}
        onClick={() => _click()}
      >
        {label}
      </Button>
      <Confirm
        open={isConfirming}
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => _click()}
        header='Are you sure?'
        content={confirmMessage}
        className='ModalText'
        size='mini'
      />
    </>
  )
}


export const BalanceRequiredButton = ({
  label,
  fee,
  onClick,
  disabled = false,
  fill = true,
  fillParent = false,
}: {
  label: string
  fee: BigNumberish
  onClick: Function
  disabled?: boolean
  fill?: boolean
  fillParent?: boolean
}) => {
  const { address } = useAccount()
  const { noFundsForFee } = useLordsBalance(address, fee)
  const canSubmit = (!noFundsForFee)
  return (
    <ActionButton large fill={fill} fillParent={fillParent}
      disabled={disabled}
      important={canSubmit}
      negative={!canSubmit}
      label={noFundsForFee ? 'No Funds!' : isPositiveBigint(fee) ? <>{label} <LordsBagIcon /></> : label}
      onClick={() => (canSubmit ? onClick() : {})}
    />
  )
}

export const FilterButton = ({
  label,
  icon,
  disabled = false,
  toggle = true,
  state = false,
  grouped = false,
  onClick,
}: {
  label?: string
  icon?: SemanticICONS
  disabled?: boolean
  toggle?: boolean
  state?: boolean
  grouped?: boolean
  onClick: Function
}) => {
  const classNames = useMemo(() => {
    let classNames = ['FilterButton']
    if (!grouped) classNames.push('FilterButtonMargin')
    return classNames
  }, [grouped])
  
  return (
    <Button
      className={classNames.join(' ')}
      toggle={toggle}
      active={state}
      disabled={disabled}
      onClick={() => onClick()}
      size='mini'
    >
      {icon && <Icon name={icon} className='NoMargin' />} {label}
    </Button>
  )
}


//-----------------
// Settings
//

interface SettingsIconProps {
  nameOn?: SemanticICONS | string
  nameOff?: SemanticICONS | string
  settingsKey: string
  value: boolean
  size: IconSizeProp
  disabled?: boolean
  icon?: boolean
}

export function SettingsIcon({
  nameOn = 'toggle on',
  nameOff = 'toggle off',
  settingsKey,
  value,
  size,
  disabled = false,
  icon = false,
}: SettingsIconProps) {
  const { dispatchSetting } = useSettings()
  const _switch = () => {
    dispatchSetting(settingsKey, !value)
  }
  return (
    <CustomIcon icon={icon} name={value ? nameOn : nameOff} onClick={() => _switch()} size={size} disabled={disabled} />
  )
}

export function MusicToggle({
  size = 'large',
}: {
  size?: IconSizeProp
}) {
  const { settings, SettingsActions } = useSettings()
  const { audioLoaded } = useThreeJsContext()
  return (
    <SettingsIcon
      settingsKey={SettingsActions.MUSIC_ENABLED}
      value={settings.musicEnabled}
      disabled={!audioLoaded}
      size={size}
      nameOn='volume-on'
      nameOff='volume-off'
      icon
    />
  )
}
export function SfxToggle({
  size = 'large',
}: {
  size?: IconSizeProp
}) {
  const { settings, SettingsActions } = useSettings()
  const { audioLoaded } = useThreeJsContext()
  return (
    <SettingsIcon
      settingsKey={SettingsActions.SFX_ENABLED}
      value={settings.sfxEnabled}
      disabled={!audioLoaded}
      size={size}
      nameOn='volume-on'
      nameOff='volume-off'
      icon
    />
  )
}


export function SettingsButton({
  prefix,
  name,
  value,
}: {
  prefix: string
  name: string
  value: boolean
}) {
  const { dispatchSetting } = useSettings()
  const _switch = () => {
    dispatchSetting(name, !value)
  }
  return <ActionButton fill dimmed={!value} label={`${prefix} ${value ? 'ON' : 'OFF'}`} onClick={() => _switch()} />
}

export function SettingsMenuItem({
  prefix,
  settingsKey,
  currentValue,
}: {
  prefix: string
  settingsKey: string
  currentValue: any
}) {
  const { dispatchSetting } = useSettings()
  const _switch = () => {
    dispatchSetting(settingsKey, !currentValue)
  }
  return (
    <Menu.Item onClick={() => _switch()}>
      {prefix} {currentValue ? 'ON' : 'OFF'}
    </Menu.Item>
  )
}

export function BackButton() {
  const { dispatchSetScene, atDoor } = usePistolsScene();

  const handleClick = () => {
    if (atDoor) {
      dispatchSetScene(SceneName.Gate);
    } else {
      dispatchSetScene(SceneName.Tavern);
    }
  }

  return (
    <CustomIcon icon name='left-arrow' onClick={() => handleClick()} size='big' disabled={false} />
  );
}

export function ChallengeButton({
  challengedPlayerAddress,
  fillParent = false,
}: {
  challengedPlayerAddress: BigNumberish,
  fillParent?: boolean
}) {
  const { dispatchChallengingPlayerAddress, dispatchSetDuel } = usePistolsContext()
  const { address } = useAccount()
  const { duelistId } = useSettings()
  const { tableId } = useTableId()
  const { isMyAccount } = useIsMyAccount(challengedPlayerAddress)
  const { hasPact, pactDuelId } = usePact(tableId, address, challengedPlayerAddress)
  const canChallenge = (duelistId > 0n && !hasPact && !isMyAccount)

  if (!hasPact) {
    return <ActionButton large fill fillParent={fillParent} disabled={!canChallenge} label='Challenge for a Duel!' onClick={() => dispatchChallengingPlayerAddress(challengedPlayerAddress)} />
  } else {
    return <ActionButton large fill fillParent={fillParent} important disabled label='Duel In Progress!' onClick={() => dispatchSetDuel(pactDuelId)} />
  }
}
