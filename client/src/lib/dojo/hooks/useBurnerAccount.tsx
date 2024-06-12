import { useCallback, useEffect, useMemo, useState } from 'react'
import { Burner, BurnerCreateOptions } from '@rsodre/create-burner'
import { useBlockNumber, useContract } from '@starknet-react/core'
import { useDojo, useDojoAccount } from '@/lib/dojo/DojoContext'
import { useLordsBalance } from '@/lib/dojo/hooks/useLords'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { BigNumberish, RpcProvider, hash } from 'starknet'
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
  const { masterAccount, account, select, deselect, checkIsDeployed } = useDojoAccount()

  //
  // Good burner: Deployed & Imported
  const { burners } = useBurners(masterAccount.address)
  const burner = useMemo(() => (burners[accountIndex] ?? null), [accountIndex, burners])
  const exists = useMemo(() => (burner != null), [burner])
  const address = useMemo(() => (burner?.address ?? null), [burner])
  const accountName = useMemo(() => (`Duelist #${accountIndex}`), [accountIndex])

  useEffect(() => {
    if (address) {
      select(address)
    } else {
      deselect()
    }
  }, [address])

  //
  // Funded?
  const { balance } = useLordsBalance(address)

  return {
    address,
    account: (account ?? null),
    isImported: exists,
    isFunded: (balance > 0n),
    accountName,
  }
}

export const useBurnerDeployment = (address: BigNumberish, createOptions?: BurnerCreateOptions) => {
  const { checkIsDeployed, create, isDeploying } = useDojoAccount()

  //
  // Verify if is already deployed
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isDeployed, setIsDeployed] = useState<boolean>(undefined)
  useEffect(() => {
    let _mounted = true
    const _check = async () => {
      const _isDeployed = await checkIsDeployed(bigintToHex(address))
      if (_mounted) {
        setIsVerifying(false)
        setIsDeployed(_isDeployed)
      }
    }
    if (address) {
      setIsVerifying(true)
      setIsDeployed(undefined)
      _check()
    }
    return () => { _mounted = false }
  }, [address])

  //
  // Deploy!
  const [deployError, setDeployError] = useState(null)
  const deployOrRestore = useCallback(() => {
    const _deploy = async () => {
      setDeployError(null)
      try {
        await create(createOptions)
      } catch (e) {
        setDeployError(e.toString())
      }
    }
    if (address && createOptions && !isVerifying) {
      _deploy();
    }
  }, [address, createOptions, isVerifying])

  return {
    address,
    isDeployed,
    isVerifying,
    isDeploying,
    deployOrRestore,
    deployError,
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
// export const useBurnerContract = (address: BigNumberish, provider?: RpcProvider) => {
//   const [cairoVersion, setCairoVersion] = useState<bigint>(undefined)
//   const [publicKey, setPublicKey] = useState<bigint>(undefined)
//   const [deployTx, setDeployTx] = useState<bigint>(undefined)

//   //
//   // Create Account contract to interact with
//   //
//   const { setup: { dojoProvider, selectedChainConfig } } = useDojo()
//   const { contract } = useContract({
//     abi: katana_account_abi,
//     address: bigintToHex(address),
//     provider: dojoProvider.provider,
//   })

//   const { data: blockNumber } = useBlockNumber()
//   const canVerify = useMemo(() => (BigInt(contract?.address ?? 0) > 0n && blockNumber > 0), [contract, blockNumber])

//   //
//   // Verify if contract exists, by interacting with it
//   //
//   useEffect(() => {
//     let _mounted = true
//     const _check_deployed = async () => {
//       // console.log('__check_contract BASE:', contract, dojoProvider.provider)
//       // console.log('__check_contract BASE.getVersion:', await contract.getVersion())
//       // console.log('__check_contract BASE.getPublicKey:', await contract.getPublicKey())
//       // const cc = await contract.deployed()
//       try {
//         const { cairo } = await contract.getVersion()
//         const { publicKey } = await contract.getPublicKey()
//         // console.log(`CAIRO:`, cairo, publicKey)
//         if (_mounted) {
//           setCairoVersion(BigInt(cairo))
//           setPublicKey(BigInt(publicKey))
//         }
//       } catch {
//         if (_mounted) {
//           setCairoVersion(0n)
//           setPublicKey(0n)
//           setDeployTx(0n)
//         }
//       }
//     }
//     if (canVerify) {
//       setCairoVersion(undefined)
//       setPublicKey(undefined)
//       setDeployTx(undefined)
//       _check_deployed()
//     }
//     return () => { _mounted = false }
//   }, [canVerify])

//   const isVerifying = useMemo(() => (canVerify && publicKey === undefined), [canVerify, publicKey])
//   const isDeployed = useMemo(() => (canVerify && Boolean(publicKey)), [publicKey])
 
//   return {
//     isVerifying,
//     isDeployed,
//     deployTx,
//     publicKey,
//     cairoVersion,
//   }
// }
