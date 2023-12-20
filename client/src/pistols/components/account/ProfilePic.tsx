import React, { useMemo } from 'react'
import { Image } from 'semantic-ui-react'


const _makeUrl = (profilePic, suffix) => {
  return `/profiles/${('00' + profilePic).slice(-2)}_${suffix}.jpg`
}

export function ProfilePicSquare({
  profilePic,
}) {
  const url = useMemo(() => _makeUrl(profilePic, 'sq'), [profilePic])
  return profilePic ? <Image src={url} className='ProfilePic' /> : <></>
}

export function ProfilePicButton({
  profilePic,
  onSelect,
  profilePicCount,
  disabled = false,
}) {
  const url = useMemo(() => _makeUrl(profilePic, 'sq'), [profilePic])
  const _click = () => {
    if (disabled) return
    const nextProfilePic = profilePic < profilePicCount ? profilePic + 1 : 1
    onSelect(nextProfilePic)
  }
  return profilePic ? <Image src={url} className={`ProfilePic ${!disabled ? `Anchor` : 'Grayscale'}`} onClick={() => _click()} /> : <></>
}
