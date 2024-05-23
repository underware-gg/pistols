import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { useLordsBalance } from '@/lib/dojo/hooks/useLords'
import { useTable } from '@/pistols/hooks/useTable'
import { useLockedLordsBalance } from '@/pistols/hooks/useWager'
import { Balance } from '@/pistols/components/account/Balance'
import { tables } from '@/pistols/utils/constants'
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
    <Balance big={big} tableId={tables.LORDS} wei={balance} pre={pre} post={post} clean={clean} />
  )
}

export const WagerBalance = ({
  tableId,
  address,
  pre = null,
  post = null,
  clean = false,
  big = false,
}) => {
  const { contractAddress } = useTable(tableId)
  const { balance } = useERC20Balance(contractAddress, address)
  return (
    <Balance big={big} tableId={tableId} wei={balance} pre={pre} post={post} clean={clean} />
  )
}

export const LockedWagerBalance = ({
  tableId,
  address,
  pre = null,
  post = null,
  clean = false,
}) => {
  const { total } = useLockedLordsBalance(address)
  if (!total) return <></>
  return (
    <>
      {' + '}
      <Balance big tableId={tableId} wei={total} pre={pre} post={post} clean={clean} />
      {' '}
      (locked)
    </>
  )
}

export function WagerAndOrFees({
  tableId,
  value,
  fee,
  pre = null,
  big = false,
}: {
  tableId: string
  value: BigNumberish
  fee: BigNumberish
  pre?: string
  big?: boolean
}) {
  if (BigInt(value ?? 0) > 0n) {
    return (
      <>
        <span>
          <Balance big={big} tableId={tableId} wei={value} pre={pre} />
        </span>
        &nbsp;&nbsp;
        {fee &&
          <span>
            (<Balance clean tableId={tableId} wei={fee} pre='+' /> fee)
          </span>
        }
      </>
    )
  }
  if (BigInt(fee ?? 0) > 0n) {
    return (
      <span>
        <Balance big={big} tableId={tableId} wei={fee} pre={pre} />
      </span>
    )
  }
  return <></>
}
