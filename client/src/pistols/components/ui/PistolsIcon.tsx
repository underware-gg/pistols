import React from 'react'
import { Icon, IconGroup } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { ActionEmojis, ActionNames } from '@/pistols/utils/pistols'
import { EmojiIcon, _downSize } from '@/lib/ui/Icons'
import { EMOJI } from '@/pistols/data/messages'
import { constants } from '@underware_gg/pistols-sdk/pistols'

export function PacesIcon({
  paces,
  dodge = false,
  size = 'large',
}: {
  paces: constants.PacesCard
  dodge?: boolean
  size?: IconSizeProp
}) {
  let pacesCount = constants.getPacesCardValue(paces)
  if (pacesCount < 1 || pacesCount > 10) {
    return <Icon name='question circle' size={size} />
  }
  const _paces = pacesCount == 10 ? '10' : '1234567890'[pacesCount - 1]
  return (
    // <EmojiIcon emoji={emoji} size={size} className='PacesIconRound' />
    <IconGroup size={_downSize(size)}>
      <EmojiIcon emoji={dodge ? EMOJI.DODGE : EMOJI.PACES} size={size} />
      <EmojiIcon emoji={_paces} size={size} className={`PacesIcon`} />
    </IconGroup>
  )
}

export function BladesIcon({
  blade,
  size = 'large',
}: {
  blade: constants.BladesCard
  size?: IconSizeProp
}) {
  if (!ActionNames[blade]) {
    return <Icon name='question circle' size={size} />
  }
  const emoji = ActionEmojis[blade] ?? EMOJI.UNKNOWN
  return (
    // <IconGroup size='large'>
    // <Icon size={size} name='circle outline' />
    <EmojiIcon emoji={emoji} size={size} className='' />
    // </IconGroup>
  )
}

export function ArchetypeIcon({
  villainous,
  trickster,
  honourable,
  size = 'large',
}: {
  villainous?: boolean
  trickster?: boolean
  honourable?: boolean
  size?: IconSizeProp
}) {
  if (villainous) return <EmojiIcon emoji={EMOJI.VILLAIN} size={size} />
  if (trickster) return <EmojiIcon emoji={EMOJI.TRICKSTER} size={size} />
  if (honourable) return <EmojiIcon emoji={EMOJI.LORD} size={size} />
  return <EmojiIcon emoji={EMOJI.NEUTRAL} size={size} />
}
