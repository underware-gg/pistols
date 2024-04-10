import { useEffect, useMemo, useState } from 'react'
import { Burner } from '@dojoengine/create-burner'
import { useContract } from '@starknet-react/core'
import { useDojo, useDojoAccount } from '@/lib/dojo/DojoContext'
import { useLordsBalance } from '@/lib/dojo/hooks/useLords'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { BigNumberish, hash } from 'starknet'
import { katana_account_abi } from '@/lib/abi'

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

export const useBurners = (masterAccountAddress: BigNumberish) => {
  const { list, count } = useDojoAccount()

  const _burners_array = useMemo(() => (
    list().reduce((a, b) => {
      if (bigintEquals(masterAccountAddress, b.masterAccount)) a.push(b)
      return a
    }, []).sort((a, b) => (a.accountIndex - b.accountIndex))
  ), [masterAccountAddress, count])

  const burners = useMemo<{ [key: string]: Burner }>(() => (
    _burners_array.reduce((a, b) => {
      a[b.accountIndex] = b
      return a
    }, {})
  ), [_burners_array])

  const lastAccountIndex = useMemo<number>(() => (
    _burners_array.reduce((a, b) => {
      if (b.accountIndex > a) return b.accountIndex
      return a
    }, 0)
  ), [_burners_array])

  return {
    burners,
    lastAccountIndex,
    nextAccountIndex: (lastAccountIndex + 1),
  }
}

export const useBurnerAccount = (accountIndex: number) => {
  const { masterAccount, count, list, select } = useDojoAccount()

  //
  // Good burner: Deployed & Imported
  const { burners } = useBurners(masterAccount.address)
  const burner = useMemo(() => (burners[accountIndex] ?? null), [accountIndex, burners])
  const address = useMemo(() => (burner?.address ?? null), [burner])

  useEffect(() => {
    if (address) {
      select(address)
    }
  }, [address])

  //
  // Funded?
  const { balance } = useLordsBalance(address)

  return {
    address,
    isDeployed: (burner != null),
    isImported: (burner != null),
    isFunded: (balance > 0n),
  }
}


//
// Verify if an account has been deployed, from the address
//
// Katana uses OpenZeppelin account contract:
// https://docs.openzeppelin.com/contracts-cairo/0.8.0/api/account#Account
// https://github.com/OpenZeppelin/cairo-contracts/blob/main/src/account/interface.cairo
// https://github.com/dojoengine/dojo/blob/main/crates/katana/primitives/contracts/compiled/account.json
//
export const useBurnerContract = (address: bigint) => {
  const [cairoVersion, setCairoVersion] = useState<bigint>(undefined)
  const [publicKey, setPublicKey] = useState<bigint>(undefined)
  const [deployTx, setDeployTx] = useState<bigint>(undefined)

  //
  // Create Account contract to interact with
  //
  const { setup: { dojoProvider, selectedChainConfig } } = useDojo()
  const { contract } = useContract({
    abi: katana_account_abi,
    address: bigintToHex(address),
    provider: dojoProvider.provider,
  })

  //
  // Verify if contract exists, by interacting with it
  //
  useEffect(() => {
    let _mounted = true
    const _check_deployed = async () => {
      // console.log('__check_contract BASE:', contract, dojoProvider.provider)
      // console.log('__check_contract BASE.getVersion:', await contract.getVersion())
      // console.log('__check_contract BASE.getPublicKey:', await contract.getPublicKey())
      // const cc = await contract.deployed()
      try {
        const { cairo } = await contract.getVersion()
        const { publicKey } = await contract.getPublicKey()
        if (_mounted) {
          setCairoVersion(BigInt(cairo))
          setPublicKey(BigInt(publicKey))
        }
      } catch {
        if (_mounted) {
          setCairoVersion(0n)
          setPublicKey(0n)
          setDeployTx(0n)
        }
      }
    }
    if (BigInt(contract?.address ?? 0) > 0n) {
      setCairoVersion(undefined)
      setPublicKey(undefined)
      setDeployTx(undefined)
      _check_deployed()
    }
    return () => { _mounted = false }
  }, [contract])

  const isVerifying = (publicKey === undefined)
  const isDeployed = Boolean(publicKey)
  // console.log(`DEPLOYED:`, isDeployed, bigintToHex(address))

  //
  // re-generate transaction hash
  // (can't find the correct arguments...)
  // (but redeploying is easier and works anyway)
  //
  // const { chain } = useNetwork()
  // useEffect(() => {
  //   if (publicKey !== undefined && cairoVersion !== undefined) {
  //     const callData: BigNumberish[] = [publicKey]
  //     //@ts-ignore (StarknetChainId)
  //     const txHash = hash.calculateDeployTransactionHash(address, callData, cairoVersion, bigintToHex(chain.id))
  //     console.log(`calculateDeployTransactionHash:`, bigintToHex(publicKey), cairoVersion, txHash)
  //     setDeployTx(BigInt(txHash ?? 0n))
  //   }
  // }, [address, publicKey, cairoVersion])
  // const isVerifying =(publicKey === undefined || deployTx === undefined)
  // const isDeployed = (deployTx && deployTx > 0n)

  return {
    isVerifying,
    isDeployed,
    deployTx,
    publicKey,
  }
}
