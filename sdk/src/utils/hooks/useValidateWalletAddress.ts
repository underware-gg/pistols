import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAddressFromStarkName } from 'src/utils/hooks/useStarkName'
import { arrayLast, bigintToAddress, bigintToAddressEth } from 'src/utils/misc/types'
import { isStarknetAddress, isEthereumAddress } from 'src/utils/misc/types'

export const useValidateWalletAddress = (address: BigNumberish) => {
  const isStarknet = useMemo(() => isStarknetAddress(address), [address])
  const isEthereum = useMemo(() => isEthereumAddress(address), [address])
  const validatedAddress = useMemo(() => (
    isStarknet ? bigintToAddress(address) : isEthereum ? bigintToAddressEth(address) : null
  ), [isStarknet, isEthereum, address])
  return {
    isAddress: (isStarknet || isEthereum),
    isStarknetAddress: isStarknet,
    isEthereumAddress: isEthereum,
    validatedAddress,
  }
}

export const useValidateWalletName = (stark_or_ens_name: string, rpcUrl: string) => {
  const extension = useMemo(() => arrayLast(stark_or_ens_name?.split('.')), [stark_or_ens_name])
  const isStarkName = useMemo(() => (extension === 'stark'), [extension])
  const isEnsName = useMemo(() => (extension === 'eth'), [extension])

  const { address: resolvedStarkAddress } = useAddressFromStarkName(isStarkName ? stark_or_ens_name : null, rpcUrl)

  const resolvedEnsAddress: string = null // TODO
  const resolvedAddress = useMemo(() => (resolvedStarkAddress ?? resolvedEnsAddress), [resolvedStarkAddress, resolvedEnsAddress])

  return {
    isStarkName,
    isEnsName,
    resolvedAddress,
  }
}

export const useValidateWalletAddressOrName = (address_or_name: BigNumberish | string, rpcUrl: string) => {
  const {
    isStarknetAddress,
    isEthereumAddress,
    validatedAddress,
  } = useValidateWalletAddress(address_or_name)

  const {
    isStarkName,
    isEnsName,
    resolvedAddress,
  } = useValidateWalletName(typeof address_or_name == 'string' ? address_or_name : null, rpcUrl)

  return {
    isStarknetAddress: (isStarknetAddress || (isStarkName && resolvedAddress)),
    isEthereumAddress: (isEthereumAddress || (isEnsName && resolvedAddress)),
    validatedAddress: (validatedAddress ?? resolvedAddress),
  }
}
