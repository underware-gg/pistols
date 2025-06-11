import React, { useMemo, useState, useEffect } from 'react'
import { Icon, IconGroup, Popup, PopupContent, PopupHeader, SemanticICONS } from 'semantic-ui-react'
import { IconProps, IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { emitter } from '/src/three/game'

export type { IconSizeProp, SemanticICONS }

// Semantic UI Icons
// https://react.semantic-ui.com/elements/icon/
// https://react.semantic-ui.com/elements/icon/#variations-size

// re-export semantic ui Icon for convenience
export { Icon }

export const _downSize = (size) => {
  return (
    size == 'small' ? 'tiny'
      : size == null ? 'small'
        : size == 'large' ? null
          : size == 'big' ? 'large'
            : size == 'huge' ? 'big'
              : null
  )
}

export const _upSize = (size) => {
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
interface IconInfoProps {
  size?: IconSizeProp
  content: string | typeof PopupContent
  header: typeof PopupHeader
}
export function IconInfo({
  size = null, // normal size
  header = null,
  content = 'gabba bagga hey',
}: IconInfoProps) {
  return (
    <Tooltip header={header} content={content}>
      <Icon name='info circle' size={size} />
    </Tooltip>
  )
}



//---------------------------------
// Loading/Sync spinner
//
interface LoadingIconProps {
  size?: IconSizeProp
  style?: any
  className?: string
}
export function LoadingIcon({
  size = 'small',
  style = {},
  className = '',
}: LoadingIconProps) {
  return (
    <Icon
      className={`ViewCentered NoPadding ${className}`}
      loading
      name='circle notch'
      size={size}
      style={style}
    />)
}


//---------------------------------
// clickable, animated icon
//
interface IconClickProps extends IconProps {
  onClick?: Function
  important?: boolean
  className?: string
  style?: any
  fitted?: boolean
  size?: IconSizeProp
  disabled?: boolean
}
export function IconClick(props: IconClickProps) {
  const classNames = (props.onClick  && !props.disabled) ? ['IconClick'] : ['IconNoClick']
  if (props.important) classNames.push('Important')
  if (props.className) classNames.push(props.className)
  const iconProps = useMemo(() => ({ ...props, important: undefined }), [props])
  return (
    <Icon {...iconProps as IconProps}
      fitted={props.fitted}
      size={props.size}
      className={classNames.join(' ')}
      style={props.style}
      onClick={() => props.onClick?.()}
    />
  )
}


//---------------------------------
// Copy to clipboard
//
interface CopyIconProps extends IconProps {
  content: string
}
export function CopyIcon(props: CopyIconProps) {
  const iconProps = useMemo(() => ({ ...props, className: 'NoMargin' }), [props])
  const _copy = () => {
    navigator?.clipboard?.writeText(props.content)
  }
  return (
    <IconClick {...iconProps} name='copy' onClick={() => _copy()} />
  )
}


//---------------------------------
// Bookmarks
//
interface BookmarkIconProps extends IconProps {
  isBookmarked: boolean
  onClick?: Function
  fitted?: boolean
  size?: IconSizeProp
  disabled?: boolean
}
export function BookmarkIcon(props: BookmarkIconProps) {
  return (
    <IconClick
      name={props.isBookmarked ? 'bookmark' : 'bookmark outline'}
      onClick={props.onClick}
      fitted={props.fitted}
      size={props.size}
      disabled={props.disabled}
    />
  )
}


//---------------------------------
// Online status
//
interface OnlineStatusIconProps extends IconProps {
  isOnline?: boolean
  isAway?: boolean
  isAvailable?: boolean
  onClick?: Function
}
export function OnlineStatusIcon(props: OnlineStatusIconProps) {
  return (
    <IconClick
      name={props.isAvailable === false ? 'minus circle' : 'circle'}
      className={props.isOnline ? 'Positive' : props.isAway ? 'Warning' : 'Negative'}
      onClick={props.onClick}
    />
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
  alt?: string
}
export function EmojiIcon({
  emoji,
  size = null,
  style = {},
  className = null,
  disabled = false,
  flipped = null,
  rotated = null,
  alt = null,
}: EmojiIconProps) {
  const classNames = useMemo(() => {
    let classNames = [className, 'icon', size, 'NoMargin']
    if (rotated) classNames.push('dirotatedabled')
    if (disabled) classNames.push('disabled')
    if (flipped) classNames.push('flipped')
    return classNames
  }, [className, size, rotated, disabled, flipped])
  return (
    <i className={classNames.join(' ')} style={style}>
      {emoji}
    </i>
  )
}


//---------------------------------
// Custom SVG icons
//
interface CustomIconProps {
  name: SemanticICONS | string,   // name of icon, logo, or Icon
  icon?: boolean,			  // if the svg is on /icons/
  logo?: boolean,			  // if the svg is on /logos/
  png?: boolean,        // use pure png file
  svg?: boolean,        // use pure svg file
  raw?: boolean,        // used for removing the top margin when loading svg or pngs
  // <Icon> fallback
  // optionals
  className?: string,
  size?: IconSizeProp,
  color?: string,       // css color
  tooltip?: string,
  onClick?: Function,
  alt?: string,
  // <Icon> fallback
  disabled?: boolean,   // if <Icon>
  flipped?: boolean,    // if <Icon>
}
export function CustomIcon({
  icon = false,
  logo = false,
  png = false,
  svg = false,
  name = 'avante',
  className = null,
  size = null,
  disabled = false,
  flipped = false,
  color = '#c8b6a8', // $color-text
  tooltip = null,
  onClick = null,
  raw = false,
  alt = null,
}: CustomIconProps) {

  const [isHovered, setIsHovered] = useState(false)

  const onMouseEnter = () => {
    if (tooltip) {
      emitter.emit('hover_description', tooltip)
      setIsHovered(true)
    }
  }
  const onMouseLeave = () => {
    emitter.emit('hover_description', null)
    setIsHovered(false)
  }

  // Cleanup tooltip on unmount if it's being shown
  useEffect(() => {
    return () => {
      if (tooltip && isHovered) {
        emitter.emit('hover_description', null)
      }
    }
  }, [tooltip, isHovered])

  const component = useMemo(() => {
    const _extension = png ? 'png' : 'svg'
    const _url = (logo ? `/logos/logo_${name}.${_extension}` : icon ? `/icons/icon_${name}.${_extension}` : null)

    // not svg, logo, icon or png
    if (!_url) {
      return <Icon 
        name={name as SemanticICONS} 
        className={className} 
        size={size} 
        disabled={disabled}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    }

    // png
    if (png || svg) {
      let _style = {
        backgroundImage: `url(${_url})`,
      }
      return (
        <i 
          className={`${className} ${onClick ? 'IconClick' : ''} icon ${size} NoMargin Relative`} 
          onClick={() => onClick?.() ?? {}}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {' '}
          <div className={raw ? 'CustomIconRaw' : png ? 'CustomIconPng' : 'CustomIconSvg'} style={_style} />
        </i>
      )
    }

    // svg logo or icon
    let _style = {
      WebkitMaskImage: `url(${_url})`,
      MaskImage: `url(${_url})`,
      backgroundColor: null,
    }
    let classNames = [className ?? '', 'CustomIcon', 'icon', size]
    if (disabled) classNames.push('Translucent')
    if (flipped) classNames.push('flipped')
    if (onClick) {
      classNames.push('IconClick CustomIconClick')
    } else {
      _style.backgroundColor = color
    }

    return (
      <i 
        className={classNames.join(' ')}
        style={_style}
        onClick={() => (onClick?.() ?? {})}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {' '}
      </i>
    )
  }, [icon, logo, png, name, className, size, color, tooltip, onClick])
  return component
}



export function IconTransfer({
  rotated,
  setRotated,
}: {
  rotated: boolean
  setRotated: Function
}) {
  const [halt, setHalt] = useState(false)
  const _click = () => {
    setRotated(!rotated)
    setHalt(true)
    setTimeout(() => {
      setHalt(false)
    }, 500)
  }
  return (
    <Icon className={`NoMargin Anchor TransferIcon ${!halt ? 'TransferIconAnim' : ''}`} onClick={() => _click()}
      name={rotated ? 'arrow alternate circle down outline' : 'arrow alternate circle up outline'}
    />
  )
}

//-------------------------
// Generic icons
//
export function IconChecked(props: IconProps) {
  return <Icon color='green' {...props} name='check' />
}
export function IconWarning(props: IconProps) {
  return <Icon color='orange' {...props} name='warning' />
}
