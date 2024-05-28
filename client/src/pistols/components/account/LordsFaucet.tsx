import { Account, AccountInterface } from 'starknet'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useLordsFaucet } from '@/lib/dojo/hooks/useLordsMock'
import { ActionButton } from '@/pistols/components/ui/Buttons'

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
  const { selectedChainConfig } = useStarknetContext()

  const { faucet, hasFaucet, isPending } = useLordsFaucet()

  const _hasFaucet = hasFaucet || Boolean(selectedChainConfig.lordsFaucetUrl)

  const onClick = () => {
    if (!isPending) {
      if (selectedChainConfig.lordsFaucetUrl) {
        window?.open(selectedChainConfig.lordsFaucetUrl, '_blank')
      } else if (hasFaucet) {
        faucet(account)
      }
    }
  }

  return (
    <ActionButton fill={fill} large={large} disabled={disabled || isPending || !_hasFaucet} onClick={onClick} label='Get $LORDS' />
  )
}
