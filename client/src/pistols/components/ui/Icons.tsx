import React from 'react'
import Link from 'next/link'
import { Icon, Popup } from 'semantic-ui-react'

// Semantic UI Icons
// https://react.semantic-ui.com/elements/icon/
// https://react.semantic-ui.com/elements/icon/#variations-size

// re-export semantic ui Icon for convenience
export { Icon }

//---------------------------------
// Popup Tooltip
// wrap content in <span> so it will apeear on disabled buttons
//
export function Tooltip(props) {
	const trigger = props.disabledTooltip ?
		<span>{props.children}</span>
		: props.children
	const content = Array.isArray(props.content)
		? props.content.map((v, i) => <span key={`e${i}`}>{v}<br /></span>)
		: props.content
	const style = props.cursor ? { cursor: props.cursor } : {}
	return (
		<span className='Tooltip' style={style}>
			<Popup
				size='small'
				header={props.header}
				content={content}
				trigger={trigger}
			/>
		</span>
	)
}
Tooltip.defaultProps = {
	header: null,
	content: 'gabba bagga hey',
	disabledTooltip: false,
	cursor: null,
}


//---------------------------------
// Info icon + Tooltip
//
export function InfoIcon(props) {
	return (
		<Tooltip header={props.header} content={props.content}>
			<Icon name='info circle' size={props.size} className='InfoIcon' />
		</Tooltip>
	)
}
InfoIcon.defaultProps = {
	size: null, // normal size
	header: null,
	content: 'gabba bagga hey',
}



//---------------------------------
// Semantic Ui icon
//
export function IconIcon(props) {
	return <Icon name={props.name} size={props.size} className={`Icon ${props.className}`} />
}
IconIcon.defaultProps = {
	name: 'smile outline',
	className: '',
	size: null, // normal size
}



//---------------------------------
// Hyperlink icon
//
export function AnchorLinkIcon(props) {
	return (
		<Link href={props.url} passHref>
			<a>
				<Icon className='Anchor InfoIcon' name='linkify' size={props.size} />
			</a>
		</Link>
	)
}
AnchorLinkIcon.defaultProps = {
	size: null, // normal size
	url: '#',
}


//---------------------------------
// Copy to clipboard icon
//
export function CopyIcon(props) {
	function _copy() {
		navigator?.clipboard?.writeText(props.content)
	}
	return (
		<Icon className='Anchor InfoIcon IconClick' name='copy' size={props.size} onClick={() => _copy()} />
	)
}
CopyIcon.defaultProps = {
	size: null, // normal size
	content: null, // content to copy
}


//---------------------------------
// Sync spinner
//
export function LoadingIcon(props) {
	return (
		<Icon
			className='ViewCentered NoPadding'
			loading
			// name='sync'
			name='compass outline'
			size={props.size}
		/>)
}
LoadingIcon.defaultProps = {
	size: 'small',
}
