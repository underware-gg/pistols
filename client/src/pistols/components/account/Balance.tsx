import { ReactNode, useMemo } from 'react'
import { CustomIcon, IconSizeProp } from '@/lib/ui/Icons'
import { weiToEthString } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export function LordsBagIcon({
  size = null,
}: {
  size?: IconSizeProp
}) {
  return <CustomIcon logo png name='lords_bag' size={size} alt='$LORDS' />
}

export function Balance({
  tableId,  // used for icon only
  ether,    // used for icon only
  value = null,
  wei = null,
  big = false,
  small = false,
  clean = false,
  crossed = false,
  pre = null,
  post = null,
  children = null,
  placeholdder = '?',
}: {
  tableId?: string
  value?: BigNumberish
  wei?: BigNumberish
  ether?: boolean
  big?: boolean
  small?: boolean
  clean?: boolean
  crossed?: boolean
  pre?: string
  post?: string
  placeholdder?: string | number
  children?: ReactNode
}) {
  const _value = useMemo<string>(() => {
    const decimals = (ether ? 6 : 0)
    return (
      wei != null ? weiToEthString(wei, decimals)
        : value != null ? weiToEthString(value, decimals)
          : ''
    )
  }, [value, wei])

  let classNames = useMemo(() => {
    let result = []
    if (small) result.push('WagerSmall')
    else if (big) result.push('WagerBig')
    else result.push('Wager')
    if (crossed) result.push('Crossed')
    return result
  }, [small, big, crossed])

  const _icon = useMemo(() => {
    if (clean) return <></>
    if (ether) return <CustomIcon logo name='ethereum' size={'small'} className='EtherIcon' />
    return <LordsBagIcon size={null} />
  }, [clean, ether, tableId])

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

