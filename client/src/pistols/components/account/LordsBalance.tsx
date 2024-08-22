import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useLordsBalance, useEtherBalance } from '@/lib/dojo/hooks/useLords'
import { useLockedLordsBalance } from '@/pistols/hooks/useWager'
import { useScoreboard } from '@/pistols/hooks/useScore'
import { Balance } from '@/pistols/components/account/Balance'
import { TABLES } from '@/games/pistols/generated/constants'


//
// Ether balance of an account
//
export const EtherBalance = ({
  address,
}) => {
  const { balance } = useEtherBalance(address)
  return (
    <Balance ether wei={balance} />
  )
}


//
// Lords balance of an account
//
export const LordsBalance = ({
  address,
  pre = null,
  post = null,
  clean = false,
  big = false,
}) => {
  const { balance } = useLordsBalance(address)
  return (
    <Balance big={big} tableId={TABLES.LORDS} wei={balance} pre={pre} post={post} clean={clean} />
  )
}


//
// Wager Balance of a Duelist on a Table
//
export const WagerBalance = ({
  duelistId,
  tableId,
} : {
  duelistId: BigNumberish
  tableId?: string
}
) => {
  const { wagerBalanceWei } = useScoreboard(tableId, duelistId)
  return (
    <Balance tableId={tableId ?? TABLES.LORDS} wei={wagerBalanceWei} />
  )
}

//
// Wager and fees of a Challenge
// Used at challenge descriptions
//
export function WagerAndOrFees({
  tableId,
  value,
  fee,
  prefixed = false,
  big = false,
}: {
  tableId: string
  value: BigNumberish
  fee: BigNumberish
  prefixed?: boolean
  big?: boolean
}) {
  const hasValue = useMemo(() => (BigInt(value ?? 0) > 0), [value])
  const hasFees = useMemo(() => (BigInt(fee ?? 0) > 0), [fee])
  const pre = useMemo(() => (prefixed ? (hasValue || !hasFees ? 'Cost: ' : 'Fee: ') : null), [prefixed, hasValue, hasFees])
  if (hasValue && hasFees) {
    return (<>
      <span>
        <Balance big={big} tableId={tableId} wei={value} pre={pre} />
      </span>
      &nbsp;&nbsp;
      <span>
        (<Balance clean tableId={tableId} wei={fee} pre='+' /> fee)
      </span>
    </>)
  }
  // value only
  if (hasValue && hasFees) {
    return (
      <span>
        <Balance big={big} tableId={tableId} wei={value} pre={pre} />
      </span>
    )
  }
  // fees only
  return (
    <span>
      <Balance big={big} tableId={tableId} wei={fee} pre={pre} placeholdder={0} />
    </span>
  )
}

//
// Locked wagers of a duslist
// Used at owned profiles
//
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
      <span className='Normal'>(wagered)</span>
    </>
  )
}

