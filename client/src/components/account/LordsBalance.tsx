import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useLordsBalance, useEtherBalance } from '@underware/pistols-sdk/dojo'
import { useFoolsBalance } from '/src/hooks/useFools'
import { useFameBalance, useFameBalanceDuelist } from '/src/hooks/useFame'
import { Balance } from '/src/components/account/Balance'
import ProgressBar from '../ui/ProgressBar'
import { IconSizeProp } from '../ui/Icons'


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
  size = null,
}) => {
  const { balance } = useLordsBalance(address)
  return (
    <Balance lords size={size} wei={balance} pre={pre} post={post} clean={clean} />
  )
}


//
// Fools balance of a player
//
export const FoolsBalance = ({
  address,
  size = null,
}: {
  address: BigNumberish
  size?: IconSizeProp
}) => {
  const { balance } = useFoolsBalance(address)
  return (
    <Balance fools size={size} wei={balance} />
  )
}

//
// Fame Balance of a contract (players dont have FAME)
//
export const FameBalance = ({
  address,
  size = null,
}: {
  address: BigNumberish
  size?: IconSizeProp
}) => {
  const { balance } = useFameBalance(address)
  return (
    <Balance fame size={size} wei={balance} />
  )
}

//
// Fame Balance of a Duelist
//
export const FameBalanceDuelist = ({
  duelistId,
  size = null,
}: {
  duelistId: BigNumberish
  size?: IconSizeProp
}) => {
  const { balance } = useFameBalanceDuelist(duelistId)
  return (
    <Balance fame size={size} wei={balance / 1000n} />
  )
}

//
// Fame Progress Bar of a Duelist
//
export const FameProgressBar = ({
  duelistId,
  label = null,
  width,
  height,
  hideValue = false,
}: {
  duelistId: BigNumberish
  label?: string
  width?: number
  height?: number
  hideValue?: boolean
}) => {
  const { balance } = useFameBalanceDuelist(duelistId)
  const progressPercent = useMemo(() => {
    return Number(balance) % 1000
  }, [balance])

  return (
    <ProgressBar className='FameProgressBar' value={progressPercent} total={1000} label={label} width={width} height={height} hideValue={hideValue} />
  )
}


//
// Fees to be paid
//
export function FeesToPay({
  fee,
  prefixed = false,
  size = null,
}: {
  value: BigNumberish
  fee: BigNumberish
  prefixed?: boolean
  size?: IconSizeProp
}) {
  const hasFees = useMemo(() => (BigInt(fee ?? 0) > 0), [fee])
  const pre = useMemo(() => (prefixed ? 'Fee: ' : null), [prefixed, hasFees])
  return (
    <span>
      <Balance lords size={size} wei={fee} pre={pre} placeholdder={0} />
    </span>
  )
}
