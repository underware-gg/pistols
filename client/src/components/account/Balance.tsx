import { ReactNode, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { CustomIcon, EmojiIcon, IconSizeProp, LoadingIcon } from '/src/components/ui/Icons'
import { ethToWei, weiToEthString } from '@underware/pistols-sdk/starknet'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { useGameAspect } from '/src/hooks/useGameAspect'

type CoinIconProps = {
  size?: IconSizeProp
}

export function EtherIcon({
  size = null,
}: CoinIconProps) {
  return <CustomIcon logo name='ethereum' size={size} className='EtherIcon' alt='$ETH' />
}

export function StrkIcon({
  size = null,
}: CoinIconProps) {
  return <CustomIcon logo svg name='starknet' size={size} alt='$STRK' />
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
  // return <EmojiIcon emoji={EMOJIS.FOOLS} size={size} alt='$FOOLS' />
}

export function FameIcon({
  size = null,
}: CoinIconProps) {
  // return <CustomIcon logo svg name='fame1' size={size} alt='$FAME' />
  return <EmojiIcon emoji={EMOJIS.FAME} size={size} alt='$FAME' />
}

export function Balance({
  ether = false,
  lords = false,
  strk = false,
  fools = false,
  fame = false,
  clean = false,
  wei = null,
  eth = null,
  decimals,
  size = null,
  bold = false,
  crossed = false,
  pre = null,
  post = null,
  children = null,
  isLoading = false,
  placeholdder = '?',
}: {
  ether?: boolean
  strk?: boolean
  lords?: boolean
  fools?: boolean
  fame?: boolean
  clean?: boolean
  eth?: BigNumberish
  wei?: BigNumberish
  decimals?: number
  size?: IconSizeProp
  bold?: boolean
  crossed?: boolean
  pre?: string
  post?: string
  placeholdder?: string | number
  isLoading?: boolean
  children?: ReactNode
}) {
  const { aspectWidth } = useGameAspect()

  const _value = useMemo<string | React.JSX.Element>(() => {
    const _decimals = decimals ?? (ether ? 6 : 0)
    const result = (
      isLoading ? <LoadingIcon />
        : wei != null ? weiToEthString(wei, _decimals)
          : eth != null ? weiToEthString(ethToWei(eth), _decimals)
            : ''
    )
    return fools ? result : ((result == '0' || result == '0.0') ? EMOJIS.ZERO : result)
  }, [decimals, eth, wei, isLoading])

  const classNames = useMemo(() => {
    let result = []
    if (bold) result.push('Bold')
    if (crossed) result.push('Crossed')
    return result
  }, [crossed, bold])

  const fontSize = useMemo(() => {
    switch(size) {
      case 'mini': return aspectWidth(0.4)
      case 'tiny': return aspectWidth(0.6)
      case 'small': return aspectWidth(0.8) 
      case 'large': return aspectWidth(1.2)
      case 'big': return aspectWidth(1.4)
      case 'huge': return aspectWidth(1.8)
      case 'massive': return aspectWidth(2.5)
      default: return aspectWidth(1)
    }
  }, [size, aspectWidth])

  const _icon = useMemo(() => {
    if (clean) return <></>
    if (ether) return <><EtherIcon size={'small'} />{' '}</>
    if (strk) return <><StrkIcon size={'small'} />{' '}</>
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