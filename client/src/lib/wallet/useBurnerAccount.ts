import { useEffect, useMemo, useState } from 'react'
import { useContract } from '@starknet-react/core'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'
import { useLordsBalance } from './useLordsBalance'
import abi from '@/lib/abi/braavos_account.json'

export const useBurner = (address: BigNumberish) => {
  const { list } = useDojoAccount()
  const burner = useMemo(() => (
    list().reduce((a, b) => {
      if (!a && bigintEquals(address, b.address)) return b
      return a
    }, null)
  ), [address])
  return burner
}

export const useBurners = (masterAccount: BigNumberish) => {
  const { list } = useDojoAccount()
  // const burners = useMemo(() => (
  //   list().reduce((a, b) => {
  //     if (bigintEquals(masterAccount, b.masterAccount)) return a.push(b)
  //     return a
  //   }, []).sort((a, b) => (a.accountIndex - b.accountIndex))
  // ), [masterAccount])
  // return burners
  return list()
}

export const useBurnerAccount = (accountIndex: number) => {
  const { masterAccount, count, list, select } = useDojoAccount()

  //
  // Good burner: Deployed & Imported
  const burner = useMemo(() => (
    (masterAccount && accountIndex) ? list().reduce((a, b) => {
      if (!a
        && accountIndex == b.accountIndex
        && masterAccount.address && bigintEquals(masterAccount.address, b.masterAccount)
      ) {
        return b
      }
      return a
    }, null) : null
  ), [accountIndex, masterAccount, count])
  const address = useMemo(() => (burner?.address ?? null), [burner])

  useEffect(() => {
    if (address) {
      select(address)
    }
  }, [address])

  //--------------------------------------------
  // TODO: verify if deployed but not imported
  //--------------------------------------------

  //
  // Funded?
  const { balance } = useLordsBalance(address)

  //
  // Profiled
  const { name } = useDuelist(address ?? 0n)
  const isProfiled = Boolean(name)

  return {
    address,
    isDeployed: (burner != null),
    isImported: (burner != null),
    isFunded: (balance > 0n),
    isProfiled,
  }
}


//
// TODO: verify if deployed but not imported
//
export const useBurnerContract = (address: bigint) => {
  const [deployTx, setDeployTx] = useState(null)
  const { contract } = useContract({ abi: abi, address: bigintToHex(address) })

  useEffect(() => {
    let _mounted = true
    const _check_deployed = async () => {
      const cc = await contract.deployed()
      if (_mounted) setDeployTx(cc?.deployTransactionHash ?? null)
      console.log('__check_contract', cc?.deployTransactionHash)
    }
    setDeployTx(null)
    if (contract?.address) _check_deployed()
    return () => { _mounted = false }
  }, [contract?.address])

  //
  // TODO: Funded
  const isFunded = false

  //
  // Profiled
  const { name } = useDuelist(address)
  const isProfiled = Boolean(name)

  return {
    isDeployed: (deployTx != null),
    deployTx,
  }
}
