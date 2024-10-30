import React, { useMemo } from 'react'
import { Image, SemanticFLOATS } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useIsMyDuelist, useIsYou } from '@/pistols/hooks/useIsYou'
import { IconClick } from '@/lib/ui/Icons'


const _makeUrl = (profilePic: number | null, square: boolean) => {
  if (profilePic === null) return null
  const variant = (square ? 'square' : 'portrait')
  return `/profiles/${variant}/${('00' + profilePic).slice(-2)}.jpg`
}
const _className = ({ small, medium, square, circle, duel, anon }) => (
  small ? 'ProfilePicSmall'
    : medium ? 'ProfilePicMedium'
      : anon ? 'ProfilePicAnon'
        : square ? 'ProfilePicSquare'
          : circle ? 'ProfilePicCircle'
            : duel ? 'ProfilePicDuel'
              : 'ProfilePic'
)

//---------------
// Portraits
//

export function ProfilePic({
  profilePic = null,
  profilePicUrl = null,
  small = false,
  medium = false,
  square = false,
  circle = false,
  duel = false,
  anon = false,
  dimmed = false,
  className = '',
  floated,
  // as button
  onClick,
  disabled = false,
  // switch button
  duelistId,
  displayBountyValue = null,
}: {
  profilePic?: number
  profilePicUrl?: string
  small?: boolean
  medium?: boolean
  square?: boolean
  circle?: boolean
  duel?: boolean
  anon?: boolean
  dimmed?: boolean
  className?: string
  floated?: SemanticFLOATS
  // as button
  onClick?: Function
  disabled?: boolean
  // switch duelist
  duelistId?: BigNumberish
  // display bounty
  displayBountyValue?: number | null
}) {
  const _clickable = (onClick != null && !disabled)

  const classNames = useMemo(() => {
    let result = [_className({ small, medium, square, circle, duel, anon }), className]
    if (_clickable) result.push('Anchor')
    if (disabled || dimmed) result.push('ProfilePicDisabled')
    return result
  }, [className, small, medium, square, circle, duel, anon, disabled, dimmed])
  const url = useMemo(() => (profilePicUrl ?? _makeUrl(profilePic, square || anon)), [profilePicUrl, profilePic, square])

  // as Button
  const _click = () => {
    if (_clickable) onClick(profilePic)
  }
  // switch duelist
  const { dispatchDuelistId } = useSettings()
  const { isYou } = useIsYou(duelistId)
  const isMyDuelist = useIsMyDuelist(duelistId)
  const _canSwitch = (Boolean(duelistId) && isMyDuelist && !isYou)
  const _switch = () => {
    dispatchDuelistId(duelistId)
  }
  const _iconStyle = floated == 'right' ? {
    top: '25px',
    left: 'unset',
    right: '25px',
  } : (floated == 'left' || _canSwitch) ? {
    top: '25px',
    left: '25px',
  } : {}

  return (
    <>
      <Image src={url} className={classNames.join(' ')} floated={floated} onClick={() => _click()} />
      {_canSwitch && <IconClick important name='sync alternate' size='big' onClick={() => _switch()} className='Absolute' style={_iconStyle} />}
    </>
  )
}

//-----------------
// Squares
//

export function ProfilePicSquare({
  profilePic,
  small = false,
  medium = false,
  className,
}: {
  profilePic: number
  small?: boolean
  medium?: boolean
  className?: string
}) {
  return <ProfilePic profilePic={profilePic} small={small} medium={medium} square className={className} />
}

export function ProfilePicSquareButton({
  profilePic,
  small = false,
  medium = false,
  disabled = false,
  dimmed = false,
  onClick,
}) {
  return <ProfilePic profilePic={profilePic} onClick={onClick} disabled={disabled} dimmed={dimmed} small={small} medium={medium} square />
}
