import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BigNumberish } from 'starknet'
import { useAccount, useContract, useBalance } from '@starknet-react/core'
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { weiToEth } from 'src/starknet/starknet'
import { erc20_abi } from 'src/abis/abis'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

export const useERC20Balance = (
  contractAddress: BigNumberish,
  ownerAddress: BigNumberish,
  fee: BigNumberish = 0n,
  watch: boolean = false,
) => {
  const isValid = useMemo(() => (isPositiveBigint(contractAddress) && isPositiveBigint(ownerAddress)), [contractAddress, ownerAddress])
  const { data: balance, isLoading } = useBalance({
    token: bigintToHex(contractAddress),
    address: bigintToHex(ownerAddress),
    watch,
    refetchInterval: watch ? 1_000 : undefined,
    enabled: isValid,
  })
  const balance_eth = useMemo(() => weiToEth(balance?.value ?? 0n), [balance])
  // console.log(`BALANCE`, (bigintToHex(contractAddress)), (bigintToHex(ownerAddress)), balance)

  const canAffordFee = useMemo(() => {
    if (balance == null || !fee) return undefined
    return (BigInt(balance.value) >= BigInt(fee))
  }, [balance, fee])

  return {
    balance: balance?.value ?? 0n,        // wei
    balance_eth,                          // eth
    formatted: balance?.formatted ?? 0,   // eth
    decimals: balance?.decimals ?? 0,     // 18
    symbol: balance?.symbol ?? '?',       // eth
    canAffordFee,
    isLoading,
    isValid,
  }
}

export const useERC20TotalSupply = (
  contractAddress: BigNumberish,
  watch: boolean = false,
) => {
  const { chainId } = useAccount()
  const contractIsValid = useMemo(() => (isPositiveBigint(contractAddress)), [contractAddress])

  const { contract } = useContract({
    abi: erc20_abi,
    address: contractIsValid ? bigintToHex(contractAddress) : null,
  })

  // Was two effects: one fetching total_supply, one resetting the state to null
  // when the address went invalid. The reset existed only because the value was
  // held in useState - as a query it is simply disabled, so there is nothing to
  // reset. That reset was the react-hooks/set-state-in-effect violation.
  //
  // Keyed on contractAddress, not the contract instance, which is not
  // serialisable.
  const { data: totalSupply, isLoading, isError, error } = useQuery<bigint>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'erc20', 'totalSupply', String(chainId), String(contractAddress)],
    enabled: contractIsValid && Boolean(contract),
    queryFn: async () => (await contract.call('total_supply')) as bigint,
  })

  return {
    totalSupply: totalSupply ?? null,
    isLoading,
    isError,
    error,
  }
}

export const useERC20TokenName = (contractAddress: BigNumberish) => {
  const { chainId } = useAccount()
  const contractIsValid = useMemo(() => (isPositiveBigint(contractAddress)), [contractAddress])

  const { contract } = useContract({
    abi: erc20_abi,
    address: contractIsValid ? bigintToHex(contractAddress) : null,
  })

  // Same shape as totalSupply above: two fetches plus a reset effect, replaced by
  // two disabled-when-invalid queries. The commented-out felt variants are left
  // as they were.
  const { data: tokenName, isLoading: nameIsLoading, isError: nameIsError, error: nameError } = useQuery<string>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'erc20', 'name', String(chainId), String(contractAddress)],
    enabled: contractIsValid && Boolean(contract),
    queryFn: async () => (await contract.call('name')) as string,
  })
  const { data: tokenSymbol, isLoading: symbolIsLoading, isError: symbolIsError, error: symbolError } = useQuery<string>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'erc20', 'symbol', String(chainId), String(contractAddress)],
    enabled: contractIsValid && Boolean(contract),
    queryFn: async () => (await contract.call('symbol')) as string,
  })

  return {
    tokenName: tokenName ?? null,
    tokenSymbol: tokenSymbol ?? null,
    isLoading: nameIsLoading || symbolIsLoading,
    isError: nameIsError || symbolIsError,
    error: nameError ?? symbolError,
  }
}
