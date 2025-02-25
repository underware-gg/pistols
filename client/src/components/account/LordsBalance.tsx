import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useLordsBalance, useEtherBalance } from '@underware_gg/pistols-sdk/dojo'
import { useFoolsBalance } from '/src/hooks/useFools'
import { useFameBalance, useFameBalanceDuelist } from '/src/hooks/useFame'
import { Balance } from '/src/components/account/Balance'


//
// Ether balance of an account
//
export const EtherBalance = ({
  address,
}: {
  address: BigNumberish
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
    <Balance lords big={big} wei={balance} pre={pre} post={post} clean={clean} />
  )
}


//
// Fools balance of a player
//
export const FoolsBalance = ({
  address,
  big = false,
}: {
  address: BigNumberish
  big?: boolean
}) => {
  const { balance } = useFoolsBalance(address)
  return (
    <Balance fools wei={balance} big={big} />
  )
}

//
// Fame Balance of a contract (players dont have FAME)
//
export const FameBalance = ({
  address,
  big = false,
}: {
  address: BigNumberish
    big?: boolean
}) => {
  const { balance } = useFameBalance(address)
  return (
    <Balance fame wei={balance} big={big} />
  )
}

//
// Fame Balance of a Duelist
//
export const FameBalanceDuelist = ({
  duelistId,
  big = false,
}: {
  duelistId: BigNumberish
  big?: boolean
}) => {
  const { balance } = useFameBalanceDuelist(duelistId)
  return (
    <Balance fame wei={balance} big={big} />
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
  return (
    <span>
      <Balance lords big={big} wei={fee} pre={pre} placeholdder={0} />
    </span>
  )
}
