import { useDojoAccount } from '@/dojo/DojoContext'
import { useLordsBalance } from './useLordsBalance'

export const LordsBalance = ({
  address
}) => {
  const { balance, formatted } = useLordsBalance(address)

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
