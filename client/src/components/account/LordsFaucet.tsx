import { useLordsFaucet } from '/src/hooks/useLordsFaucet'
import { ActionButton } from '/src/components/ui/Buttons'

export const LordsFaucet = ({
  fill = false,
  large = false,
  disabled = false,
}: {
  fill?: boolean
  large?: boolean
  disabled?: boolean
}) => {
  const { mintLords, isMinting } = useLordsFaucet()
  return (
    <ActionButton important fill={fill} large={large} disabled={disabled || isMinting} onClick={mintLords} label='Get $LORDS' />
  )
}
