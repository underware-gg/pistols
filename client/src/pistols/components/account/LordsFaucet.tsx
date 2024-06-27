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

  const { mintLords, isMinting, faucetUrl } = useLordsFaucet()

  const onClick = () => {
    if (!isMinting) {
      if (faucetUrl) {
        window?.open(faucetUrl, '_blank')
      } else {
        mintLords(account)
      }
    }
  }

  return (
    <ActionButton important fill={fill} large={large} disabled={disabled || isMinting} onClick={onClick} label='Get $LORDS' />
  )
}
