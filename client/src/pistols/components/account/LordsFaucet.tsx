import { Account, AccountInterface } from 'starknet'
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

  const { faucet, isPending, faucetUrl } = useLordsFaucet()

  const onClick = () => {
    if (!isPending) {
      if (faucetUrl) {
        window?.open(faucetUrl, '_blank')
      } else {
        faucet(account)
      }
    }
  }

  return (
    <ActionButton important fill={fill} large={large} disabled={disabled || isPending} onClick={onClick} label='Get $LORDS' />
  )
}
