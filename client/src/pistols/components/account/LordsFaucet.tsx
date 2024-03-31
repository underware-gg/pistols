import { useCoin, COIN_LORDS } from '@/pistols/hooks/useConfig'
import { useLordsFaucet } from '@/lib/wallet/useLordsFaucet'

export const LordsFaucet = () => {
  const { contractAddress } = useCoin(COIN_LORDS)
  const { faucet, hasFaucet, isPending } = useLordsFaucet(contractAddress)

  const onClick = () => {
    if (isPending) return
    faucet()
  }

  if (!hasFaucet) {
    return <></>
  }

  return (
    <>
      {/* <Icon name='add' /> */}
      [ <span className='Anchor Important' onClick={onClick}>get free $LORDS</span> ]
    </>
  )
}
