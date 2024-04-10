import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { useLordsBalance } from '@/lib/dojo/hooks/useLords'
import { useCoin } from '@/pistols/hooks/useCoin'
import { useLockedWagerTotals } from '@/pistols/hooks/useWager'
import { Balance } from '@/pistols/components/account/Balance'
import { coins } from '@/pistols/utils/constants'
import { BigNumberish } from 'starknet'

export const LordsBalance = ({
  address,
  pre = null,
  post = null,
  clean = false,
  big = false,
}) => {
  const { balance } = useLordsBalance(address)
  return (
    <Balance big={big} coin={coins.LORDS} wei={balance} pre={pre} post={post} clean={clean} />
  )
}

export const WagerBalance = ({
  coin = coins.LORDS,
  address,
  pre = null,
  post = null,
  clean = false,
  big = false,
}) => {
  const { contractAddress } = useCoin(coin)
  const { balance } = useERC20Balance(contractAddress, address)
  return (
    <Balance big={big} coin={coins.LORDS} wei={balance} pre={pre} post={post} clean={clean} />
  )
}

export const LockedWagerBalance = ({
  coin,
  address,
  pre = null,
  post = null,
  clean = false,
}) => {
  const { total } = useLockedWagerTotals(address, coin)
  if (!total) return <></>
  return (
    <>
      {' + '}
      <Balance big coin={coins.LORDS} wei={total} pre={pre} post={post} clean={clean} />
      {' '}
      (locked)
    </>
  )
}

export function WagerAndOrFees({
  coin,
  value,
  fee,
  pre = null,
  big = false,
}: {
  coin: number
  value: BigNumberish
  fee: BigNumberish
  pre?: string
  big?: boolean
}) {
  if (BigInt(value ?? 0) > 0n) {
    return (
      <>
        <span>
          <Balance big={big} coin={coin} wei={value} pre={pre} />
        </span>
        &nbsp;&nbsp;
        <span>
          (<Balance clean coin={coin} wei={fee} pre='+' /> fee)
        </span>
      </>
    )
  }
  if (BigInt(fee ?? 0) > 0n) {
    return (
      <span>
        <Balance big={big} coin={coin} wei={fee} pre={pre} />
      </span>
    )
  }
  return <></>
}
