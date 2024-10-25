import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useLordsBalance, useEtherBalance } from '@/lib/dojo/hooks/useLords'
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
// Fame Balance of a Duelist
//
export const FameBalance = ({
  duelistId,
} : {
  duelistId: BigNumberish
}
) => {
  return (
    <Balance tableId={TABLES.LORDS} wei={0} />
  )
}

//
// Fees to be paid
//
export function FeesToPay({
  fee,
  prefixed = false,
  big = false,
}: {
  value: BigNumberish
  fee: BigNumberish
  prefixed?: boolean
  big?: boolean
}) {
  const hasFees = useMemo(() => (BigInt(fee ?? 0) > 0), [fee])
  const pre = useMemo(() => (prefixed ? 'Fee: ' : null), [prefixed, hasFees])
  // fees only
  return (
    <span>
      <Balance big={big} wei={fee} pre={pre} placeholdder={0} />
    </span>
  )
}
