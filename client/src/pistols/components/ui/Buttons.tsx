import React from 'react'
import { Menu, Button, Icon, SemanticICONS } from 'semantic-ui-react'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'

//-----------------
// Generic Action button
//

type ActionButtonProps = {
  label: string
  disabled?: boolean
  large?: boolean
  fill?: boolean
  dimmed?: boolean
  attention?: boolean
  className?: string
  onClick: () => void
}

export const ActionButton = ({
  label,
  disabled = false,
  large = false,
  fill = false,
  dimmed = false,
  attention = false,
  className = null,
  onClick,
}: ActionButtonProps) => {
  let classNames = []
  if (attention && !disabled) classNames.push('Attention')
  if (fill) classNames.push('FillParent')
  if (large) classNames.push('LargeButton')
  classNames.push((disabled || dimmed) ? 'Locked' : 'Unlocked')
  if (className) classNames.push(className)
  return <Button className={classNames.join(' ')} disabled={disabled} onClick={() => onClick()}>{label}</Button>
}


//-----------------
// Settings
//

interface SettingsIconProps {
  iconOn?: SemanticICONS
  iconOff?: SemanticICONS
  name: string
  value: boolean
}

export function SettingsIcon({
  iconOn = 'toggle on',
  iconOff = 'toggle off',
  name,
  value,
}: SettingsIconProps) {
  const { dispatchSetting } = useSettingsContext()
  const _switch = () => {
    dispatchSetting(name, !value)
  }
  return (
    <div onClick={() => _switch()}>
      {value ? <Icon name={iconOn} /> : <Icon name={iconOff} />}
    </div>
  )
}

interface SettingsButtonProps {
  prefix: string
  name: string
  value: boolean
}

export function SettingsButton({
  prefix,
  name,
  value,
}: SettingsButtonProps) {
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

