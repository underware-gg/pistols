import React, { useEffect, useMemo, useRef } from 'react'
import { Image, SemanticFLOATS } from 'semantic-ui-react'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { makeProfilePicUrl } from '@underware/pistols-sdk/pistols'
import { useGameAspect } from '/src/hooks/useGameAspect'

export function ProfilePic({
  profilePic = null,
  profilePicUrl = null,
  profileType = constants.DuelistProfile.Genesis,
  small = false,
  medium = false,
  large = false,
  duel = false,
  width,
  height,
  circle = false,
  removeCorners = false,
  removeBorder = false,
  removeShadow = false,
  borderRadius,
  borderWidth,
  borderColor,
  dimmed = false,
  className = '',
  floated,
  // as button
  onClick,
  disabled = false,
}: {
  profilePic?: number
  profilePicUrl?: string
  profileType?: constants.DuelistProfile
  small?: boolean
  medium?: boolean
  large?: boolean
  duel?: boolean
  width?: number
  height?: number
  circle?: boolean
  removeCorners?: boolean
  removeBorder?: boolean
  removeShadow?: boolean
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  dimmed?: boolean
  className?: string
  floated?: SemanticFLOATS
  // as button
  onClick?: Function
  disabled?: boolean
}) {
  const { aspectWidth } = useGameAspect()

  const imageRef = useRef<HTMLImageElement>(null)

  const _clickable = (onClick != null && !disabled)
  const _click = () => {
    if (_clickable) onClick(profilePic)
  }

  const url = useMemo(() => (profilePicUrl ?? makeProfilePicUrl(profilePic, profileType)), [profilePicUrl, profilePic, profileType])

  const classNames = useMemo(() => {
    let result = ['ProfilePic NoDrag', className]
    if (_clickable) result.push('Anchor YesMouse')
    if (disabled || dimmed) result.push('ProfilePicDisabled')
    
    if (!removeBorder) {
      if (borderWidth || borderColor) {
        result.push('CustomBorder')
      } else {
        result.push('Border')
      }
    }
    if (!removeShadow) result.push('Shadow')
    return result
  }, [className, disabled, dimmed, onClick, borderWidth, borderColor, removeShadow])

  useEffect(() => {
    if (!imageRef.current) return;

    let baseWidth = width ?? (small ? 2 : medium ? 4 : large ? 6 : duel ? 8.5 : 8);
    let baseHeight = height ?? baseWidth;

    imageRef.current.style.setProperty('--profile-pic-width', `${aspectWidth(baseWidth)}px`);
    imageRef.current.style.setProperty('--profile-pic-height', `${aspectWidth(baseHeight)}px`);
    imageRef.current.style.setProperty('--profile-pic-clip-path', circle ? 'circle()' : 'none');
    imageRef.current.style.setProperty('--profile-pic-object-fit', circle ? 'cover' : 'cover');
    // imageRef.current.style.setProperty('--profile-pic-object-position', circle && !square ? '50% 20%' : '50% 50%');
    
    imageRef.current.style.setProperty('--profile-pic-border', 
      (borderWidth && borderColor) ? `${aspectWidth(borderWidth)}px solid ${borderColor}` :
      borderWidth ? `${aspectWidth(borderWidth)}px solid #c8b6a8` :
      borderColor ?? `1px solid ${borderColor}`
    );
    imageRef.current.style.setProperty('--profile-pic-border-radius', removeCorners ? '0px' : borderRadius ? `${aspectWidth(borderRadius)}px` : `${aspectWidth(0.2)}px`);
    imageRef.current.style.setProperty('--profile-pic-shadow', removeShadow ? 'none' : 'unset');

  }, [small, medium, large, duel, width, height, aspectWidth, circle, removeCorners, borderRadius, removeBorder, borderWidth, borderColor, removeShadow]);

  return (
    <>
      <Image ref={imageRef} src={url} className={classNames.join(' ')} floated={floated} onClick={() => _click()} />
    </>
  )
}