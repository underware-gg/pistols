import React from 'react'
import Link from 'next/link'
import { Icon, Popup, PopupContent, PopupHeader, SemanticICONS } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'

// Semantic UI Icons
// https://react.semantic-ui.com/elements/icon/
// https://react.semantic-ui.com/elements/icon/#variations-size

// re-export semantic ui Icon for convenience
export { Icon }

//---------------------------------
// Popup Tooltip
// wrap content in <span> so it will apeear on disabled buttons
//
interface TooltipProps {
  content: string | typeof PopupContent
  header: typeof PopupHeader
  disabledTooltip?: boolean
  cursor?: string
  children: any
}
export function Tooltip({
  header = null,
  content = 'gabba bagga hey',
  disabledTooltip = false,
  cursor = null,
  children = null,
}: TooltipProps) {
  const _trigger = disabledTooltip ?
    <span>{children}</span>
    : children
  const _content = Array.isArray(content)
    ? content.map((v, i) => <span key={`e${i}`}>{v}<br /></span>)
    : content
  const _style = cursor ? { cursor: cursor } : {}
  return (
    <span className='Tooltip' style={_style}>
      <Popup
        size='small'
        header={header}
        content={_content}
        trigger={_trigger}
      />
    </span>
  )
}


//---------------------------------
// Info icon + Tooltip
//
interface InfoIconProps {
  size?: IconSizeProp
  content: string | typeof PopupContent
  header: typeof PopupHeader
}
export function InfoIcon({
  size = null, // normal size
  header = null,
  content = 'gabba bagga hey',
}: InfoIconProps) {
  return (
    <Tooltip header={header} content={content}>
      <Icon name='info circle' size={size} className='InfoIcon' />
    </Tooltip>
  )
}



//---------------------------------
// Semantic Ui icon
//
interface IconIconProps {
  name: SemanticICONS
  size?: IconSizeProp
  className: string
}
export function IconIcon({
  name = 'smile outline',
  className = '',
  size = null, // normal size
}: IconIconProps) {
  return <Icon name={name} size={size} className={`Icon ${className}`} />
}



//---------------------------------
// Hyperlink icon
//
interface AnchorLinkIconProps {
  size?: IconSizeProp
  url: string
}
export function AnchorLinkIcon({
  size = null, // normal size
  url = '#',
}: AnchorLinkIconProps) {
  return (
    <Link href={url} passHref>
      <a>
        <Icon className='Anchor InfoIcon' name='linkify' size={size} />
      </a>
    </Link>
  )
}


//---------------------------------
// Copy to clipboard icon
//
interface CopyIconProps {
  size?: IconSizeProp
  content: string
}
export function CopyIcon({
  size = null, // normal size
  content = null, // content to copy
}: CopyIconProps) {
  function _copy() {
    navigator?.clipboard?.writeText(content)
  }
  return (
    <Icon className='Anchor InfoIcon IconClick' name='copy' size={size} onClick={() => _copy()} />
  )
}


//---------------------------------
// Sync spinner
//
interface LoadingIconProps {
  size?: IconSizeProp
}
export function LoadingIcon({
  size = 'small',
}: LoadingIconProps) {
  return (
    <Icon
      className='ViewCentered NoPadding'
      loading
      // name='sync'
      name='compass outline'
      size={size}
    />)
}



//---------------------------------
// Emoji Icon
//
interface EmojiIconProps {
  emoji: string
  size?: IconSizeProp
  style?: any
  flipped?: 'horizontally' | 'vertically'
  rotated?: 'clockwise' | 'counterclockwise'
}
export function EmojiIcon({
  emoji,
  size = 'small',
  style = {},
  flipped = null,
  rotated = null,
}: EmojiIconProps) {
  return (
    <i className={`icon ${size} ${rotated && `${rotated} rotated`} ${flipped && `${flipped} flipped`}`} style={style}>
      <div className={``}>
        {emoji}
      </div>
    </i>
  )
}
