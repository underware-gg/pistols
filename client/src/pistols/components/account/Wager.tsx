import { useMemo } from 'react'
import { CopyIcon, CustomIcon } from '@/pistols/components/ui/Icons'
import { bigintToHex } from '@/pistols/utils/utils'
import { BigNumberish } from 'starknet'
import { weiToEth } from '@/pistols/utils/starknet'

function Wager({
  coin = 1,
  value = null,
  wei = null,
}: {
  coin: number
  value?: BigNumberish
  wei?: BigNumberish
}) {
  const _value = useMemo(() => {
    return wei != null ? weiToEth(wei).toString()
      : value != null ? BigInt(value).toString()
        : null

  }, [value, wei])
  if (!_value) return <></>
  return (
    <div className='Wager'>
      {/* <CustomIcon name='lords' logo color={'bisque'} centered={false} /> */}
      💰{_value}
    </div>
  )
}

export {
  Wager,
}
