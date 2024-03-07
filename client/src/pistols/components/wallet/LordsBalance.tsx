import { useDojoAccount } from '@/dojo/DojoContext'
import { useLordsBalance } from './useLordsBalance'

export const LordsBalance = () => {
  const { account } = useDojoAccount()
  const { lordsBalance } = useLordsBalance(account.address)

  return (
    <div>
      {/* {iconsBySymbol[balance?.symbol as iconsBySymbolKeys] && iconsBySymbol[balance?.symbol as iconsBySymbolKeys]({})} */}
      💰
      <span className='TitleCase'>{lordsBalance.toString()}</span>
      {/* <span>{balance?.formatted || 0}</span> */}
      {/* <span>{balance?.symbol || "?"}</span> */}
      {/* <span>{token}</span> */}
    </div>
  )
}
