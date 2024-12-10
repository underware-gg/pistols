import { ReactNode, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { CustomIcon, EmojiIcon, IconSizeProp } from '@/lib/ui/Icons'
import { weiToEthString } from '@/lib/utils/starknet'
import { EMOJI } from '@/pistols/data/messages'

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
  return <CustomIcon logo png name='lords_bag' size={size} alt='$LORDS' />
}

export function FameIcon({
  size = null,
}: CoinIconProps) {
  return <EmojiIcon emoji={EMOJI.FAME} size={size} alt='$FAME' />
}

export function Balance({
  ether = false,    // used for icon only
  lords = false,    // used for icon only
  fame = false,     // used for icon only
  clean = false,    // no icon
  value = null,
  decimals,
  wei = null,
  big = false,
  small = false,
  crossed = false,
  pre = null,
  post = null,
  children = null,
  placeholdder = '?',
}: {
  ether?: boolean
  lords?: boolean
  fame?: boolean
  clean?: boolean
  value?: BigNumberish
  wei?: BigNumberish
  decimals?: number
  big?: boolean
  small?: boolean
  crossed?: boolean
  pre?: string
  post?: string
  placeholdder?: string | number
  children?: ReactNode
}) {
  const _value = useMemo<string>(() => {
    const _decimals = decimals ?? (ether ? 6 : 0)
    const result = (
      wei != null ? weiToEthString(wei, _decimals)
        : value != null ? weiToEthString(value, _decimals)
          : ''
    )
    return (result == '0' || result == '0.0') ? EMOJI.ZERO : result
  }, [decimals, value, wei])

  const classNames = useMemo(() => {
    let result = []
    if (small) result.push('CoinSmall')
    else if (big) result.push('CoinBig')
    else result.push('Coin')
    if (crossed) result.push('Crossed')
    return result
  }, [small, big, crossed])

  const _icon = useMemo(() => {
    if (clean) return <></>
    if (ether) return <><EtherIcon size={'small'} />{' '}</>
    if (lords) return <><LordsBagIcon size={null} />{' '}</>
    if (fame) return <><FameIcon size={'small'} />{' '}</>
    return <></>
  }, [clean, lords, fame, ether])

  return (
    <span className={classNames.join(' ')}>
      {pre}
      {/* {!clean && <>💰</>} */}
      {/* {!clean && <EmojiIcon emoji='💰' />} */}
      {_icon}
      {_value || children || placeholdder}
      {post}
    </span>
  )
}

