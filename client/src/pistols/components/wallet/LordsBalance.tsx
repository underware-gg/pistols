import { useDojoAccount } from '@/dojo/DojoContext'
import { useLordsBalance } from './useLordsBalance'

export const LordsBalance = () => {
  const { account } = useDojoAccount()
  const { balance, formatted } = useLordsBalance(account.address)

  return (
    <div>
      {/* {iconsBySymbol[balance?.symbol as iconsBySymbolKeys] && iconsBySymbol[balance?.symbol as iconsBySymbolKeys]({})} */}
      💰
      {/* <span className='TitleCase'>{balance.toString()}</span> */}
      <span className='TitleCase'>{formatted}</span>
      {/* <span>{balance?.symbol || "?"}</span> */}
      {/* <span>{token}</span> */}
    </div>
  )
}
