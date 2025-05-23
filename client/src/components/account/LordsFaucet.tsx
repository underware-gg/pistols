import { Account, AccountInterface } from 'starknet'
import { useLordsFaucet } from '/src/hooks/useLordsFaucet'
import { ActionButton } from '/src/components/ui/Buttons'

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

  const { mintLords, isMinting } = useLordsFaucet()

  const onClick = () => {
    mintLords(account)
  }

  return (
    <ActionButton important fill={fill} large={large} disabled={disabled || isMinting} onClick={onClick} label='Get $LORDS' />
  )
}
