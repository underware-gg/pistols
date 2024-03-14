import React, { ReactElement, useState } from 'react'
import { Menu, Button, Confirm, SemanticICONS } from 'semantic-ui-react'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { CustomIcon } from './Icons'
import { useLordsBalance } from '../wallet/useLordsBalance'
import { useDojoAccount } from '@/dojo/DojoContext'

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
  dimmed?: boolean
  attention?: boolean
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
  dimmed = false,
  attention = false,
  negative = false,
  confirm = false,
  confirmMessage = null,
  className = null,
  onClick,
}: ActionButtonProps) => {
  let classNames = []
  if (attention && !disabled) classNames.push('Attention')
  if (fill) classNames.push('FillParent')
  if (large) classNames.push('LargeButton')
  classNames.push((disabled || dimmed) ? 'Locked' : 'Unlocked')
  if (negative) classNames.push('Negative')
  if (className) classNames.push(className)

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
  wagerValue,
  fee,
  onClick,
  disabled = false,
}) => {
  const { account } = useDojoAccount()
  const { balance, noFunds } = useLordsBalance(account.address, wagerValue + fee)
  return (
    <ActionButton fill
      disabled={disabled}
      attention={!noFunds}
      negative={noFunds}
      label={noFunds ? 'No Funds!' : label}
      onClick={() => (noFunds ? {} : onClick())}
    />
  )
}

export const FilterButton = ({
  label,
  toggle = true,
  state = false,
  switchState,
}) => {
  return (
    <Button
      className='FilterButton'
      toggle={toggle}
      active={state}
      onClick={() => switchState()}
      size='mini'
    >
      {label}
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
  icon?: boolean
}

export function SettingsIcon({
  nameOn = 'toggle on',
  nameOff = 'toggle off',
  settingsKey,
  value,
  icon = false,
}: SettingsIconProps) {
  const { dispatchSetting } = useSettingsContext()
  const _switch = () => {
    dispatchSetting(settingsKey, !value)
  }
  return <CustomIcon icon={icon} name={value ? nameOn : nameOff} onClick={() => _switch()} />
}

export function MusicToggle({
}) {
  const { settings, SettingsActions } = useSettingsContext()
  const { audioLoaded } = useThreeJsContext()
  if (!audioLoaded) return <></>
  return <SettingsIcon settingsKey={SettingsActions.MUSIC_ENABLED} value={settings.musicEnabled} nameOn='volume-on' nameOff='volume-off' icon />
}
export function SfxToggle({
}) {
  const { settings, SettingsActions } = useSettingsContext()
  return <SettingsIcon settingsKey={SettingsActions.SFX_ENABLED} value={settings.sfxEnabled} nameOn='volume-on' nameOff='volume-off' icon />
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
  const { dispatchSetting } = useSettingsContext()
  const _switch = () => {
    dispatchSetting(name, !value)
  }
  return <ActionButton fill dimmed={!value} label={`${prefix} ${value ? 'ON' : 'OFF'}`} onClick={() => _switch()} />
}

export function SettingsMenuItem({
  prefix,
  settingsKey,
  currentValue,
}) {
  const { dispatchSetting } = useSettingsContext()
  const _switch = () => {
    dispatchSetting(settingsKey, !currentValue)
  }
  return (
    <Menu.Item onClick={() => _switch()}>
      {prefix} {currentValue ? 'ON' : 'OFF'}
    </Menu.Item>
  )
}

