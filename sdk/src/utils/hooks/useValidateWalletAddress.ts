import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAddressFromStarkName } from 'src/utils/hooks/useStarkName'
import { sanitizedAddress, STARKNET_ADDRESS_LENGTHS, ETHEREUM_ADDRESS_LENGTH } from 'src/starknet/starknet'
import { arrayLast } from 'src/utils/misc/types'

export const useValidateWalletAddress = (address: BigNumberish) => {
  const formattedAddress = useMemo(() => (sanitizedAddress(address) ?? ''), [address])

  // Starknet address
  // ex: 0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a
  // ex: 0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
  const isStarknetAddress = useMemo(() => (
    formattedAddress.length == STARKNET_ADDRESS_LENGTHS[0] || formattedAddress.length == STARKNET_ADDRESS_LENGTHS[1]
  ), [formattedAddress])

  // Eheterum address
  // ex: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
  const isEthereumAddress = useMemo(() => (formattedAddress.length == ETHEREUM_ADDRESS_LENGTH), [formattedAddress])

  const isAddress = useMemo(() => (isStarknetAddress || isEthereumAddress), [isStarknetAddress, isEthereumAddress])
  const validatedAddress = useMemo(() => (isAddress ? formattedAddress : null), [isAddress, formattedAddress])

  return {
    isAddress,
    isStarknetAddress,
    isEthereumAddress,
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
