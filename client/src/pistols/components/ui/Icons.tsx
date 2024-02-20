import React, { useMemo } from 'react'
import Link from 'next/link'
import { Icon, IconGroup, Popup, PopupContent, PopupHeader, SemanticICONS } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { Blades, BladesNames } from '@/pistols/utils/pistols'
import { EMOJI } from '@/pistols/data/messages'

// Semantic UI Icons
// https://react.semantic-ui.com/elements/icon/
// https://react.semantic-ui.com/elements/icon/#variations-size

// re-export semantic ui Icon for convenience
export { Icon }

const _downSize = (size) => {
  return (
    size == 'small' ? 'tiny'
      : size == null ? 'small'
        : size == 'large' ? null
          : size == 'big' ? 'large'
            : size == 'huge' ? 'big'
              : null
  )
}

const _upSize = (size) => {
  return (
    size == 'tiny' ? 'small'
      : size == 'small' ? null
        : size == null ? 'large'
          : size == 'large' ? 'big'
            : size == 'big' ? 'huge'
              : null
  )
}

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
  className?: string
  disabled?: boolean
  flipped?: 'horizontally' | 'vertically'
  rotated?: 'clockwise' | 'counterclockwise'
}
export function EmojiIcon({
  emoji,
  size = null,
  style = {},
  className = null,
  disabled = false,
  flipped = null,
  rotated = null,
}: EmojiIconProps) {
  return (
    <i className={`${className} icon ${size} ${rotated && `${rotated} rotated`} ${disabled && `disabled`} ${flipped && `${flipped} flipped`} NoMargin`} style={style}>
      {emoji}
    </i>
  )
}


//---------------------------------
// Duel Icons
//
interface StepsIconProps {
  stepCount: number
  size?: IconSizeProp
}
export function StepsIcon({
  stepCount,
  size = 'large',
}: StepsIconProps) {
  if (stepCount < 1 || stepCount > 10) {
    return <Icon name='question circle' size={size} />
  }
  const steps = stepCount == 10 ? '10' : '1234567890'[stepCount - 1]
  return (
    // <EmojiIcon emoji={emoji} size={size} className='StepsIconRound' />
    <IconGroup size={_downSize(size)}>
      <EmojiIcon emoji={EMOJI.STEP} size={size} />
      <EmojiIcon emoji={steps} size={size} className={`StepsIcon`} />
    </IconGroup>
  )
}
interface BladesIconProps {
  blade: Blades
  size?: IconSizeProp
}
export function BladesIcon({
  blade,
  size = 'large',
}: BladesIconProps) {
  if (!BladesNames[blade]) {
    return <Icon name='question circle' size={size} />
  }
  const emoji =
    blade == Blades.Light ? EMOJI.LIGHT
      : blade == Blades.Heavy ? EMOJI.HEAVY
        : blade == Blades.Block ? EMOJI.BLOCK
          : EMOJI.UNKNOWN
  return (
    // <IconGroup size='large'>
    // <Icon size={size} name='circle outline' />
    <EmojiIcon emoji={emoji} size={size} className='' />
    // </IconGroup>
  )
}


//---------------------------------
// Ticked Icons
//
interface CompletedIconProps {
  completed: boolean
  size?: IconSizeProp
  children: any
}
export function CompletedIcon({
  completed,
  size = null,
  children,
}: CompletedIconProps) {
  return (
    <IconGroup size={(size)}>
      {children}
      {completed && <Icon size={_upSize(size)} name='checkmark' color='green' style={{ margin: '-4px 0 0 0' }} />}
    </IconGroup>
  )
}


//---------------------------------
// Custom SVG icons
//
interface CustomIconProps {
  svgUrl?: string,			// optional
  icon?: boolean,			  // if the svg is on /icons/
  logo?: boolean,			  // if the svg is on /logos/
  name: SemanticICONS | string,   // name of icon, logo, or Icon
  className?: string,
  centered?: boolean,
  size?: IconSizeProp,	// if <Icon>
  color?: string,        // css color
  tooltip?: string,
  onClick?: Function,
}
export function CustomIcon({
  svgUrl,
  icon,
  logo,
  name = 'chess board',
  className,
  centered = true,
  size = null,
  color = '#cb824d', // $color-medium
  tooltip = null,
  onClick = null,
}: CustomIconProps) {
  const component = useMemo(() => {
    const _url = svgUrl ?? (logo ? `/logos/logo_${name}.svg` : icon ? `/icons/icon_${name}.svg` : null)
    let result = null
    if (_url) {
      let _style = {
        WebkitMaskImage: `url(${_url})`,
        MaskImage: `url(${_url})`,
        backgroundColor: null,
      }
      let classNames = ['CustomIcon']
      if (className) classNames.push(className)
      if (onClick) {
        classNames.push('IconLink')
      } else {
        _style.backgroundColor = color
      }
      result = (
        <div className={`CustomIconWrapper${centered ? 'Centered' : ''}`} onClick={() => (onClick?.() ?? {})}>
          <div className={classNames.join(' ')} style={_style} />
        </div>
      )
    } else {
      result = <Icon name={name as SemanticICONS} className={className} size={size} />
    }

    // result = _linkfy(result, props.linkUrl)

    // TODO: breaks something, need to debug!
    // if(props.tooltip) {
    // 	content = <Tooltip content={props.tooltip}>{content}</Tooltip>	
    // }

    return result
  }, [svgUrl, icon, logo, name, className, centered, size, color, tooltip, onClick])
  return component
}

// export function LogoIcon(props) {
//   return <CustomIcon logo name={props.name} linkUrl={props.linkUrl} className={props.className} color={props.color} tooltip={props.tooltip} />
// }
// export function OpenSeaIcon(props) {
//   return <CustomIcon logo name='opensea' linkUrl={props.linkUrl} className={props.className} color={props.color} tooltip={props.tooltip} />
// }
// export function EtherscanIcon(props) {
//   return <CustomIcon logo name='etherscan' linkUrl={props.linkUrl} className={props.className} color={props.color} tooltip={props.tooltip} />
// }
// export function DoorIcon(props) {
//   return <CustomIcon icon name='door' linkUrl={props.linkUrl} className={props.className} color={props.color} tooltip={props.tooltip} />
// }

