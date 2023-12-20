import React, { useMemo } from 'react'
import { Image } from 'semantic-ui-react'


const _makeUrl = (profilePic, suffix) => {
  return `/profiles/${('00' + profilePic).slice(-2)}_${suffix}.jpg`
}

export function ProfilePic({
  profilePic,
}) {
  const url = useMemo(() => _makeUrl(profilePic, 'a'), [profilePic])
  return profilePic ? <Image src={url} className='ProfilePic' /> : <></>
}

export function ProfilePicSquare({
  profilePic,
}) {
  const url = useMemo(() => _makeUrl(profilePic, 'sq'), [profilePic])
  return profilePic ? <Image src={url} className='ProfilePicSquare' /> : <></>
}

export function ProfilePicButton({
  profilePic,
  onSelect,
  disabled = false,
}) {
  const url = useMemo(() => _makeUrl(profilePic, 'sq'), [profilePic])
  const _click = () => {
    if (disabled) return
    const nextProfilePic = profilePic < process.env.PROFILE_PIC_COUNT ? profilePic + 1 : 1
    onSelect(nextProfilePic)
  }
  return profilePic ? <Image src={url} className={`ProfilePicSquare ${!disabled ? `Anchor` : 'Grayscale'}`} onClick={() => _click()} /> : <></>
}
