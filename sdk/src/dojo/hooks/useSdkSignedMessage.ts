import { useCallback, useEffect, useState } from 'react'
import { Account, TypedData, stark } from 'starknet'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { useStarknetContext } from 'src/dojo/contexts/StarknetProvider'
import { serialize } from 'src/utils/misc/types'
import { useConnectedController } from 'src/dojo/hooks/useController'

// export const useSdkPublishSignedMessage = <M extends PistolsModelType>(
//   account: Account,
//   modelName: string,
//   message: M,
// ) => {
//   const { sdk } = useDojoSetup()
//   const typedData = useMemo<TypedData>(() => (
//     sdk?.generateTypedData<M>(modelName, message)
//   ), [sdk, modelName, message])
//   return useSdkPublishTypedData(account, typedData)
// }

export const useSdkPublishTypedData = (
  account: Account,
  typedData: TypedData,
) => {
  const { sdk } = useDojoSetup()
  const { isControllerConnected } = useConnectedController()
  const { selectedNetworkConfig } = useStarknetContext()
  const [isPublishing, setIsPublishing] = useState<boolean>()

  const publish = useCallback(async () => {
    if (sdk && typedData && account) {
      if (!isControllerConnected) {
        console.warn('useSdkPublishSignedMessage() needs Cartridge Controller!')
        return
      }
      if (!selectedNetworkConfig.relayUrl) {
        console.error('useSdkPublishSignedMessage() failed: relayUrl is not set')
        return
      }
      if (isPublishing) {
        console.warn('useSdkPublishSignedMessage() still publishing...')
        return
      }

      setIsPublishing(true)

      // console.log('ONLINE: publish...', message, typedData)
      // await sdk.sendMessage(typedData, account)

      try {
        // console.log('SIGNED_MESSAGE: sign...', serialize(typedData), typedData)
        let signature = await account.signMessage(typedData);
        // console.log('SIGNED_MESSAGE: signature:', signature)
        if (!Array.isArray(signature)) {
          signature = stark.formatSignature(signature)
        }

        try {
          console.log(`SIGNED_MESSAGE: publish... (${signature.length})`)//, signature)
          await sdk.client.publishMessage(
            JSON.stringify(typedData),
            signature as string[],
          );
          console.log('SIGNED_MESSAGE: published!')
        } catch (error) {
          console.error("useSdkPublishSignedMessage() failed to publish message:", error, typedData, signature);
        }
      } catch (error) {
        console.error("useSdkPublishSignedMessage() failed to sign message:", error, typedData);
      }

      // console.log('SIGNED: done!')
      setIsPublishing(false)
    }
  }, [sdk, typedData, account, isControllerConnected])

  return {
    isPublishing,
    publish,
  }
}
