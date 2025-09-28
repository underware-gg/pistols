import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { Menu, Button, Confirm, SemanticICONS, Icon } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useFoolsBalance, useLordsBalance } from '/src/stores/coinStore'
import { usePactSubscription } from '/src/queries/usePact'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { CustomIcon, IconClick, IconSizeProp } from '/src/components/ui/Icons'
import { LordsBagIcon, FoolsIcon } from '/src/components/account/Balance'
import { SceneName } from '/src/data/assets'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useTransactionObserver } from '/src/hooks/useTransaction'
import { showElementPopupNotification } from '/src/components/ui/ElementPopupNotification'

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
  loadingClassName?: string
  loading?: boolean
  onClick: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
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
  loadingClassName = null,
  loading = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
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
        disabled={disabled || loading}
        onClick={() => _click()}
        onMouseEnter={() => onMouseEnter?.()}
        onMouseLeave={() => onMouseLeave?.()}
      >
        {label}
        {loading && (
          <div className={`button-loading-overlay ${loadingClassName}`}>
            <div className='button-dialog-spinner-container CenteredContainer'>
              <div className='dialog-spinner'></div>
            </div>
          </div>
        )}
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
  loading = false,
  fill = true,
  fillParent = false,
  large = true,
  fools = false,
}: {
  label: string
  fee: BigNumberish
  onClick: Function
  disabled?: boolean
  loading?: boolean
  fill?: boolean
  fillParent?: boolean
    large?: boolean
  fools?: boolean
}) => {
  const { address } = useAccount()
  const { canAffordFee: canAffordFeeLords } = useLordsBalance(address, fee)
  const { canAffordFee: canAffordFeeFools } = useFoolsBalance(address, fee)
  const canSubmit = fools ? (canAffordFeeFools !== false) : (canAffordFeeLords !== false)
  return (
    <ActionButton large={large} fill={fill} fillParent={fillParent}
      disabled={disabled || !canSubmit}
      loading={loading}
      important={canSubmit}
      negative={!canSubmit}
      label={!canSubmit ? 'No Funds!' : isPositiveBigint(fee) ? <>{label} {fools ? <FoolsIcon /> : <LordsBagIcon />}</> : label}
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

export function SettingsGearButton({
  size = 'large',
}: {
  size?: IconSizeProp
}) {
  const { settingsOpener } = usePistolsContext()
  return (
    <IconClick 
      name="settings" 
      onClick={() => settingsOpener.open()} 
      size={size}
    />
  )
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

export function BackButton({
  icon = 'back_arrow',
  size = 'huge',
}: {
  icon?: string
  size?: IconSizeProp
}) {
  const { dispatchSetScene, atDoor, dispatchSceneBack } = usePistolsScene();

  const handleClick = () => {
    if (atDoor) {
      dispatchSetScene(SceneName.Gate);
    } else {
      dispatchSceneBack();
    }
  }

  return (
    <CustomIcon icon png={icon == 'back_arrow'} raw={icon == 'back_arrow'} name={icon} onClick={() => handleClick()} size={size} disabled={false} />
  );
}

export function HomeButton({
  size = 'huge',
}: {
  size?: IconSizeProp
}) {
  const { dispatchSetScene } = usePistolsScene();

  const handleClick = () => {
    dispatchSetScene(SceneName.Tavern);
  }

  return (
    <CustomIcon icon png raw name={'home'} onClick={() => handleClick()} size={size} disabled={false} />
  );
}

export function ChallengeButton({
  challengedPlayerAddress,
  fillParent = false,
  customLabel = null,
  loadingClassName = null,
}: {
  challengedPlayerAddress: BigNumberish,
  fillParent?: boolean
  customLabel?: string
  loadingClassName?: string
}) {
  const { dispatchChallengingPlayerAddress, dispatchSelectDuel, duelistSelectOpener } = usePistolsContext()
  const { address } = useAccount()

  const { isMyAccount } = useIsMyAccount(challengedPlayerAddress)
  const { hasPact, pactDuelId } = usePactSubscription(constants.DuelType.Seasonal, address, challengedPlayerAddress, true)
  const canChallenge = (!hasPact && !isMyAccount)

  const { isLoading, isWaitingForIndexer } = useTransactionObserver({ key: `create_duel${challengedPlayerAddress}`, indexerCheck: hasPact })

  const buttonRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isWaitingForIndexer) {
      showElementPopupNotification(buttonRef, "Transaction successfull! Waiting for indexer...", "🔄")
    }
  }, [isWaitingForIndexer])

  return (
    <>
      <div className='NoMouse NoDrag' ref={buttonRef} style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }} /> {/* popupnotification anchor element */}
      {!hasPact ? (
        <ActionButton large fillParent={fillParent} important disabled={!canChallenge} loading={isLoading} loadingClassName={loadingClassName} label={customLabel ?? 'Challenge for a Duel!'} onClick={() => {
          dispatchChallengingPlayerAddress(challengedPlayerAddress)
          duelistSelectOpener.open()
        }} />
      ) : (
        <ActionButton large fillParent={fillParent} important label='Duel In Progress!' onClick={() => dispatchSelectDuel(pactDuelId)} />
      )}
    </>
  )
}
