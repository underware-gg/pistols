import React, { useMemo } from 'react'
import { Image } from 'semantic-ui-react'


const _makeUrl = (profilePic: number, suffix: string) => {
  return `/profiles/${('00' + profilePic).slice(-2)}_${suffix}.jpg`
}
const _className = (small: boolean, square: boolean, duel: boolean) => (small ? 'ProfilePicSmall' : square ? 'ProfilePicSquare' : duel ? 'ProfilePicDuel' : 'ProfilePic')
const _suffix = (square: boolean) => (square ? 'sq' : 'a')

//---------------
// Portraits
//

export function ProfilePic({
  profilePic,
  small = false,
  square = false,
  duel = false,
  floated = null,
}) {
  const className = useMemo(() => _className(small, square, duel), [square])
  const suffix = useMemo(() => _suffix(square), [square])
  const url = useMemo(() => _makeUrl(profilePic, suffix), [profilePic, suffix])
  return <Image src={url} className={className} floated={floated}/>
}

export function ProfilePicButton({
  profilePic,
  onClick,
  small = false,
  square = false,
  duel = false,
  disabled = false,
}) {
  const className = useMemo(() => _className(small, square, duel), [square])
  const suffix = useMemo(() => _suffix(square), [square])
  const url = useMemo(() => _makeUrl(profilePic, suffix), [profilePic, suffix])
  const _click = () => {
    if (!disabled) onClick(profilePic)
  }
  return <Image src={url} className={`${className} ${!disabled ? `Anchor` : 'Grayscale'}`} onClick={() => _click()} />
}

//-----------------
// Squares
//

export function ProfilePicSquare({
  profilePic,
  small = false,
}) {
  return <ProfilePic profilePic={profilePic} small={small} square={true} />
}

export function ProfilePicSquareButton({
  profilePic,
  small = false,
  disabled = false,
  onClick,
}) {
  return <ProfilePicButton profilePic={profilePic} onClick={onClick} disabled={disabled} small={small} square={true} />
}
