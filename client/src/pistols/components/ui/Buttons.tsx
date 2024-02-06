import React, { ReactElement } from 'react'
import { Menu, Button, Icon, SemanticICONS } from 'semantic-ui-react'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { CustomIcon } from './Icons'

//-----------------
// Generic Action button
//

type ActionButtonProps = {
  label: string | ReactElement
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

