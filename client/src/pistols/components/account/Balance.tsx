import { useMemo } from 'react'
import { CustomIcon, IconSizeProp } from '@/lib/ui/Icons'
import { weiToEth } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export function LordsBagIcon({
  size = null,
} : {
  size?: IconSizeProp
}) {
  return <CustomIcon logo png name='lords_bag' size={size} />
}

export function Balance({
  coin, // used for icon only
  value = null,
  wei = null,
  big = false,
  small = false,
  clean = false,
  crossed = false,
  pre = null,
  post = null,
}: {
  coin: number
  value?: BigNumberish
  wei?: BigNumberish
  big?: boolean
  small?: boolean
  clean?: boolean
  crossed?: boolean
  pre?: string
  post?: string
}) {
  const _value = useMemo(() => {
    let result = wei != null ? weiToEth(wei).toString()
      : value != null ? BigInt(value).toString()
        : null
    if (result) result = Number(result).toLocaleString('en-US', { maximumFractionDigits: 8 })
    return result
  }, [value, wei])

  let classNames = useMemo(() => {
    let result = []
    if (small) result.push('WagerSmall')
    else if (big) result.push('WagerBig')
    else result.push('Wager')
    if (crossed) result.push('Crossed')
    return result
  }, [small, big, crossed])

  if (!_value) return <></>

  return (
    <span className={classNames.join(' ')}>
      {pre}
      {/* {!clean && <>💰</>} */}
      {/* {!clean && <EmojiIcon emoji='💰' />} */}
      {!clean && <LordsBagIcon size={null} />}
      {_value}
      {post}
    </span>
  )
}

