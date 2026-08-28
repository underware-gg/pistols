import { useMemo } from 'react'
import { useAccount as useStartAccount, useProvider } from '@starknet-start/react'
import { WalletAccountV5 } from 'starknet'

/**
 * Compatibility boundary for the application's Starknet account contract.
 *
 * Starknet Start exposes the connected wallet and address but no longer returns
 * the Starknet.js AccountInterface that the Pistols transaction layer uses.
 * Recreate the same WalletAccountV5 that Starknet Start uses internally so the
 * rest of the application stays independent of wallet-standard details.
 */
export const useAccount = () => {
  const connection = useStartAccount()
  const { provider, paymasterProvider } = useProvider()

  const account = useMemo(() => {
    if (!connection.connector || !connection.address) return undefined

    return new WalletAccountV5({
      address: connection.address,
      provider,
      walletProvider: connection.connector,
      paymaster: paymasterProvider,
    })
  }, [connection.address, connection.connector, paymasterProvider, provider])

  return { ...connection, account }
}
