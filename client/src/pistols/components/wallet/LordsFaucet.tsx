import { Icon } from 'semantic-ui-react'
import { useFaucet } from './useFaucet'

export const LordsFaucet = () => {
  const { isPending, faucet } = useFaucet();
 
  const onClick = () => {
    if(isPending) return
    faucet();
  }

  return (
    <>
      {/* <Icon name='add' /> */}
      [<span className='Anchor Important' onClick={onClick} >faucet</span>]
    </>
  );
};
