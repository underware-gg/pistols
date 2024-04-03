import { Account, AccountInterface } from 'starknet'
import { useCoin, COIN_LORDS } from '@/pistols/hooks/useConfig'
import { useLordsFaucet } from '@/lib/wallet/useLordsFaucet'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useDojo } from '@/lib/dojo/DojoContext'

export const LordsFaucet = ({
  fill = false,
  large = false,
  disabled = false,
  account,
}: {
  fill?: boolean
  large?: boolean
  disabled?: boolean
  account?: Account | AccountInterface
}) => {
  const { setup: { dojoChainConfig } } = useDojo()

  const { contractAddress } = useCoin(COIN_LORDS)
  const { faucet, hasFaucet, isPending } = useLordsFaucet(contractAddress)

  const _hasFaucet = hasFaucet || Boolean(dojoChainConfig.lordsFaucetUrl)

  const onClick = () => {
    if (!isPending) {
      if (dojoChainConfig.lordsFaucetUrl) {
        window?.open(dojoChainConfig.lordsFaucetUrl, '_blank')
      } else if (hasFaucet) {
        faucet(account)
      }
    }
  }

  return (
    <ActionButton fill={fill} large={large} disabled={disabled || isPending || !_hasFaucet} onClick={onClick} label='Get $LORDS' />
  )
}
