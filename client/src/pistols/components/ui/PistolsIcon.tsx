import React from 'react'
import { Icon, IconGroup } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { Action, ActionEmojis, ActionNames } from '@/pistols/utils/pistols'
import { EmojiIcon, _downSize } from '@/lib/ui/Icons'
import { EMOJI } from '@/pistols/data/messages'

export function ActionIcon({
  action,
  size = 'large',
}: {
  action: number
  size?: IconSizeProp
}) {
  if (action >= 1 && action <= 10) {
    return <PacesIcon paces={action} size={size} />
  } else {
    return <BladesIcon blade={action} size={size} />
  }
}

export function PacesIcon({
  paces,
  size = 'large',
}: {
  paces: number
  size?: IconSizeProp
}) {
  if (paces < 1 || paces > 10) {
    return <Icon name='question circle' size={size} />
  }
  const _paces = paces == 10 ? '10' : '1234567890'[paces - 1]
  return (
    // <EmojiIcon emoji={emoji} size={size} className='PacesIconRound' />
    <IconGroup size={_downSize(size)}>
      <EmojiIcon emoji={EMOJI.PACES} size={size} />
      <EmojiIcon emoji={_paces} size={size} className={`PacesIcon`} />
    </IconGroup>
  )
}

export function BladesIcon({
  blade,
  size = 'large',
}: {
  blade: Action
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
