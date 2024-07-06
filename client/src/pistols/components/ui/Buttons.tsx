import React, { ReactElement, useState } from 'react'
import { Menu, Button, Confirm, SemanticICONS } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useTableBalance } from '@/pistols/hooks/useTable'
import { bigintAdd } from '@/lib/utils/types'
import { CustomIcon } from '@/lib/ui/Icons'
import { BigNumberish } from 'starknet'
import { LordsBagIcon } from '../account/Balance'

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
  dimmed = false,
  important = false,
  negative = false,
  confirm = false,
  confirmMessage = null,
  className = null,
  onClick,
}: ActionButtonProps) => {
  let classNames = []
  if (important && !disabled) classNames.push('Important')
  // if (fill) classNames.push('FillParent')
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
  tableId,
  wagerValue,
  minWagerValue,
  fee,
  onClick,
  disabled = false,
}: {
  label: string
  tableId: string
  wagerValue: BigNumberish
  minWagerValue?: BigNumberish
  fee: BigNumberish
  onClick: Function
  disabled?: boolean
}) => {
  const { account } = useAccount()
  const { balance, noFundsForFee } = useTableBalance(tableId, account.address, bigintAdd(wagerValue, fee))
  const wagerTooLow = (BigInt(minWagerValue ?? 0) > 0n && BigInt(wagerValue) < BigInt(minWagerValue))
  const canSubmit = (!wagerTooLow && !noFundsForFee)
  return (
    <ActionButton fill
      disabled={disabled}
      important={canSubmit}
      negative={!canSubmit}
      label={wagerTooLow ? 'Minimum Not Met' : noFundsForFee ? 'No Funds!' : <>{label} <LordsBagIcon /></>}
      onClick={() => (canSubmit ? onClick() : {})}
    />
  )
}

export const FilterButton = ({
  label,
  toggle = true,
  state = false,
  switchState,
}: {
  label: string
  toggle?: boolean
  state?: boolean
  switchState: Function
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
  const { dispatchSetting } = useSettings()
  const _switch = () => {
    dispatchSetting(settingsKey, !value)
  }
  return (
    <CustomIcon icon={icon} name={value ? nameOn : nameOff} onClick={() => _switch()} size='large' />
  )
}

export function MusicToggle() {
  const { settings, SettingsActions } = useSettings()
  const { audioLoaded } = useThreeJsContext()
  if (!audioLoaded) return <></>
  return <SettingsIcon settingsKey={SettingsActions.MUSIC_ENABLED} value={settings.musicEnabled} nameOn='volume-on' nameOff='volume-off' icon />
}
export function SfxToggle() {
  const { settings, SettingsActions } = useSettings()
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

