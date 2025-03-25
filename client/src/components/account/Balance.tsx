import { ReactNode, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { CustomIcon, EmojiIcon, IconSizeProp } from '/src/components/ui/Icons'
import { weiToEthString } from '@underware/pistols-sdk/utils/starknet'
import { EMOJI } from '/src/data/messages'
import { useGameAspect } from '/src/hooks/useGameAspect'

type CoinIconProps = {
  size?: IconSizeProp
}

export function EtherIcon({
  size = null,
}: CoinIconProps) {
  return <CustomIcon logo name='ethereum' size={size} className='EtherIcon' alt='$ETH' />
}

export function LordsBagIcon({
  size = null,
}: CoinIconProps) {
  return <CustomIcon logo svg name='lords_bag' size={size} alt='$LORDS' />
}

export function FoolsIcon({
  size = null,
}: CoinIconProps) {
  return <CustomIcon logo svg name='fools' size={size} alt='$FOOLS' />
  // return <EmojiIcon emoji={EMOJI.FOOLS} size={size} alt='$FOOLS' />
}

export function FameIcon({
  size = null,
}: CoinIconProps) {
  // return <CustomIcon logo svg name='fame1' size={size} alt='$FAME' />
  return <EmojiIcon emoji={EMOJI.FAME} size={size} alt='$FAME' />
}

export function Balance({
  ether = false,
  lords = false,
  fools = false,
  fame = false,
  clean = false,
  value = null,
  decimals,
  wei = null,
  size = null,
  bold = false,
  crossed = false,
  pre = null,
  post = null,
  children = null,
  placeholdder = '?',
}: {
  ether?: boolean
  lords?: boolean
  fools?: boolean
  fame?: boolean
  clean?: boolean
  value?: BigNumberish
  wei?: BigNumberish
  decimals?: number
  size?: IconSizeProp
  bold?: boolean
  crossed?: boolean
  pre?: string
  post?: string
  placeholdder?: string | number
  children?: ReactNode
}) {
  const { aspectWidth } = useGameAspect()

  const _value = useMemo<string>(() => {
    const _decimals = decimals ?? (ether ? 6 : 0)
    const result = (
      wei != null ? weiToEthString(wei, _decimals)
        : value != null ? weiToEthString(value, _decimals)
          : ''
    )
    return fools ? result : ((result == '0' || result == '0.0') ? EMOJI.ZERO : result)
  }, [decimals, value, wei])

  const classNames = useMemo(() => {
    let result = []
    if (bold) result.push('Bold')
    if (crossed) result.push('Crossed')
    return result
  }, [crossed, bold])

  const fontSize = useMemo(() => {
    switch(size) {
      case 'tiny': return aspectWidth(0.6)
      case 'small': return aspectWidth(0.8) 
      case 'big': return aspectWidth(1.4)
      case 'huge': return aspectWidth(1.8)
      default: return aspectWidth(1)
    }
  }, [size, aspectWidth])

  const _icon = useMemo(() => {
    if (clean) return <></>
    if (ether) return <><EtherIcon size={'small'} />{' '}</>
    if (lords) return <><LordsBagIcon size={null} />{' '}</>
    if (fools) return <><FoolsIcon size={null} />{' '}</>
    if (fame) return <><FameIcon size={'small'} />{' '}</>
    return <></>
  }, [clean, lords, fools, fame, ether])

  return (
    <span className={classNames.join(' ')} style={{ fontSize }}>
      {pre}
      {_icon}
      {_value || children || placeholdder}
      {post}
    </span>
  )
}