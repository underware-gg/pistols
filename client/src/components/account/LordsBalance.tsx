import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useLordsBalance, useEtherBalance, useFoolsBalance, useFameBalance, useDuelistFameBalance, useStrkBalance } from '/src/stores/coinStore'
import { Balance } from '/src/components/account/Balance'
import { weiToEth } from '@underware/pistols-sdk/starknet'
import { IconSizeProp } from '/src/components/ui/Icons'
import ProgressBar from '/src/components/ui/ProgressBar'


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
// Ether balance of an account
//
export const StrkBalance = ({
  address,
  decimals = 3,
}: {
  address: BigNumberish
  decimals?: number
}) => {
  const { balance } = useStrkBalance(address)
  return (
    <Balance strk wei={balance} decimals={decimals} />
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
  decimals = undefined,
}) => {
  const { balance } = useLordsBalance(address, 0n)
  return (
    <Balance lords size={size} wei={balance} pre={pre} post={post} clean={clean} decimals={decimals} />
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
  const { balance } = useDuelistFameBalance(duelistId)
  return (
    <Balance fame size={size} wei={balance} />
  )
}
export const FameLivesDuelist = ({
  duelistId,
  size = null,
}: {
  duelistId: BigNumberish
  size?: IconSizeProp
}) => {
  const { balance } = useDuelistFameBalance(duelistId)
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
  const { balance } = useDuelistFameBalance(duelistId)
  const progressPercent = useMemo(() => {
    return Number(weiToEth(balance)) % 1000
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
