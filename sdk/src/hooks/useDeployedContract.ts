import { useEffect, useMemo, useState } from 'react'
import { useContract } from '@starknet-react/core'
import { Abi, BigNumberish, CairoVersion, CompilerVersion } from 'starknet'
import { bigintToHex, isPositiveBigint } from '../utils'

export const useDeployedContract = (contractAddress: BigNumberish, abi: Abi) => {

  const [cairoVersion, setCairoVersion] = useState<CairoVersion>(undefined)
  const [compilerVersion, setCompilerVersion] = useState<CompilerVersion>(undefined)
  const [isDeployed, setIsDeployed] = useState<boolean>(!contractAddress ? false : undefined)

  const options = useMemo(() => ({
    abi,
    address: isPositiveBigint(contractAddress) ? bigintToHex(contractAddress) : null,
  }), [contractAddress, abi])
  const { contract } = useContract(options)

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      try {
        const { cairo, compiler } = await contract.getVersion()
        if (_mounted) {
          setCairoVersion(cairo)
          setCompilerVersion(compiler)
          setIsDeployed(true)
        }
      } catch {
        if (_mounted) {
          setCairoVersion(undefined)
          setCompilerVersion(undefined)
          setIsDeployed(false)
        }
      }
    }
    _fetch()
    return () => { _mounted = false }
  }, [contract])

  return {
    isDeployed,
    cairoVersion,
    compilerVersion,
  }
}
