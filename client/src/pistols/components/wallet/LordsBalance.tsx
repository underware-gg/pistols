import { useLordsBalance } from '@/lib/wallet/useLordsBalance'
import { useCoin, COIN_LORDS } from '@/pistols/hooks/useConfig'
import { Wager } from '@/pistols/components/account/Wager'
import { useLockedWager } from '@/pistols/hooks/useWager'

export const LordsBalance = ({
  address,
  pre = null,
  post = null,
  clean = false,
}) => {
  const { contractAddress } = useCoin(COIN_LORDS)
  const { balance, formatted } = useLordsBalance(contractAddress, address)
  return (
    <Wager big coin={COIN_LORDS} wei={balance} pre={pre} post={post} clean={clean} />
  )
}

export const LockedBalance = ({
  address,
  pre = null,
  post = null,
  clean = false,
}) => {
  const { total } = useLockedWager(address)
  if (!total) return <></>
  return (
    <>
      {' + '}
      <Wager big coin={COIN_LORDS} wei={total} pre={pre} post={post} clean={clean} />
      {' '}
      (locked)
    </>
  )
}

