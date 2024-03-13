import { useDojoAccount } from '@/dojo/DojoContext'
import { useLordsBalance } from './useLordsBalance'
import { COIN_LORDS } from '@/pistols/hooks/useConfig'
import { Wager } from '@/pistols/components/account/Wager'

export const LordsBalance = ({
  address
}) => {
  const { balance, formatted } = useLordsBalance(address)
  return (
    <Wager big coin={COIN_LORDS} wei={balance} />
  )
}
