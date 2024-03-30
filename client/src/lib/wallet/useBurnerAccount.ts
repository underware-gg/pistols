import { useEffect, useMemo } from 'react'
import { useContract } from '@starknet-react/core'
import { useDojoAccount } from '@/dojo/DojoContext'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import account_abi from '@/lib/abi/braavos_account.json'
import { Contract } from 'starknet'


export const useBurnerAccount = (address: bigint) => {
  const { list, count } = useDojoAccount()

  const [isDeployed, isImported] = useMemo(() => {
    const burner = list().reduce((a, v) => {
      if (a) return a
      return bigintEquals(v.address, address) ? v : null
    }, null)
    if (burner) {
      return [true, true]
    }

    return [false, false]
  }, [address, count])

  //
  // TODO: verify if deployed but not imported
  //
  const { contract } = useContract({ abi: account_abi, address: bigintToHex(address) })
  
  useEffect(() => {
    const _check_deployed = async () => {
      const cc = await contract.deployed()
      console.log('__check_contract', cc?.deployTransactionHash, cc)
    }
    if (contract) _check_deployed()
  }, [contract])

  return {
    isDeployed,
    isImported,
  }
}
