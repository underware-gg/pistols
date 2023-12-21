import React, { useMemo } from 'react'
import { Image } from 'semantic-ui-react'


const _makeUrl = (profilePic: number, suffix: string) => {
  return `/profiles/${('00' + profilePic).slice(-2)}_${suffix}.jpg`
}
const _className = (square: boolean) => (square ? 'ProfilePicSquare' : 'ProfilePic')
const _suffix = (square: boolean) => (square ? 'sq' : 'a')

//---------------
// Portraits
//

export function ProfilePic({
  profilePic,
  square = false,
  floated = null,
}) {
  const className = useMemo(() => _className(square), [square])
  const suffix = useMemo(() => _suffix(square), [square])
  const url = useMemo(() => _makeUrl(profilePic, suffix), [profilePic, suffix])
  return profilePic ? <Image src={url} className={className} floated={floated} /> : <></>
}

export function ProfilePicButton({
  profilePic,
  onClick,
  square = false,
  disabled = false,
}) {
  const className = useMemo(() => _className(square), [square])
  const suffix = useMemo(() => _suffix(square), [square])
  const url = useMemo(() => _makeUrl(profilePic, suffix), [profilePic, suffix])
  const _click = () => {
    if (!disabled) onClick(profilePic)
  }
  return profilePic ? <Image src={url} className={`${className} ${!disabled ? `Anchor` : 'Grayscale'}`} onClick={() => _click()} /> : <></>
}

//-----------------
// Squares
//

export function ProfilePicSquare({
  profilePic,
}) {
  return <ProfilePic profilePic={profilePic} square={true} />
}

export function ProfilePicSquareButton({
  profilePic,
  onClick,
  disabled = false,
}) {
  return <ProfilePicButton profilePic={profilePic} onClick={onClick} disabled={disabled} square={true} />
}
