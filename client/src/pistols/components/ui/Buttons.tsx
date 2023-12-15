import React from 'react'
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
  onClick: () => void
};

const ActionButton = ({
  label,
  disabled = false,
  large = false,
  fill = false,
  dimmed = false,
  onClick,
}: ActionButtonProps) => {
  let classNames = ['FillParent']
  classNames.push((disabled || dimmed) ? 'Locked' : 'Unlocked')
  if (large) classNames.push('LargeButton')
  if (fill) classNames.push('FillParent')
  const _button = <button className={classNames.join(' ')} disabled={disabled} onClick={() => onClick()}>{label}</button>
  if (large) {
    return <h3>{_button}</h3>
  }
  return <h4>{_button}</h4>
}


//-----------------
// Settings
//

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
  const { dispatch } = useSettingsContext()
  const _switch = () => {
    dispatch({
      type: name,
      payload: !value,
    })
  }
  return <ActionButton fill dimmed={!value} label={`${prefix} ${value ? 'ON' : 'OFF'}`} onClick={() => _switch()} />
}



//-----------------
// Exports
//
export {
  ActionButton,
}
