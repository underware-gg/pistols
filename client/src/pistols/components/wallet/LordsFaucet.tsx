import { Icon } from 'semantic-ui-react'
import { useFaucet } from './useFaucet'

export const LordsFaucet = () => {
  const { faucet, hasFaucet, isPending } = useFaucet()

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
      [ <span className='Anchor Important' onClick={onClick}>get free lordings</span> ]
    </>
  )
}
