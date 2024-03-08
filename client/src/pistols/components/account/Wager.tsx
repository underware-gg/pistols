import { useMemo } from 'react'
import { CopyIcon, CustomIcon } from '@/pistols/components/ui/Icons'
import { bigintToHex } from '@/pistols/utils/utils'
import { BigNumberish } from 'starknet'
import { weiToEth } from '@/pistols/utils/starknet'
import { COIN_LORDS } from '@/pistols/hooks/useConfig'

function Wager({
  coin = COIN_LORDS,
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
    <span className='Wager'>
      {/* <CustomIcon name='lords' logo color={'bisque'} centered={false} /> */}
      💰{_value}
    </span>
  )
}

function WagerAndOrFees({
  coin = COIN_LORDS,
  value,
  fee,
}: {
  coin: number
  value: BigNumberish
  fee: BigNumberish
}) {
  if (BigInt(value ?? 0) > 0n) {
    return (
      <>
        <span className='H3 TitleCase Bold'>
          <Wager coin={coin} wei={value} />
        </span>
        &nbsp;
        <span className='H5 TitleCase'>
          (minus <Wager coin={coin} wei={fee} /> fee)
        </span>
      </>
    )
  }
  if (BigInt(fee ?? 0) > 0n) {
    return (
      <span className='H3 TitleCase Bold'>
        Fee <Wager coin={coin} wei={fee} />
      </span>
    )
  }
  return <></>
}

export {
  Wager,
  WagerAndOrFees,
}
