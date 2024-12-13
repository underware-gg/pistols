import { useCallback, useMemo, useState } from 'react'
import { Account, TypedData, stark } from 'starknet'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { PistolsModelType } from '@/lib/dojo/hooks/useSdkTypes'

export const useSdkPublishSignedMessage = <M extends PistolsModelType>(
  modelName: string,
  message: M,
  account: Account,
) => {
  const { sdk } = useDojoSetup()
  const { selectedChainConfig } = useSelectedChain()
  const [isPublishing, setIsPublishing] = useState<boolean>()

  const typedData = useMemo<TypedData>(() => (
    sdk?.generateTypedData(modelName, message)
  ), [sdk, modelName, message])
  
  const publish = useCallback(async () => {
    if (sdk && typedData && account) {
      if (!selectedChainConfig.relayUrl) {
        console.error('useSdkPublishSignedMessage() failed: relayUrl is not set')
        return
      }
      
      setIsPublishing(true)

      // console.log('ONLINE: publish...', message, typedData)
      // await sdk.sendMessage(typedData, account)

      try {
        let signature = await account.signMessage(typedData);
        console.log('SIGNED_MESSAGE: signature:', typedData, signature)
        if (!Array.isArray(signature)) {
          signature = stark.formatSignature(signature)
        }

        try {
          console.log('SIGNED_MESSAGE: publish...', signature)
          await sdk.client.publishMessage(
            JSON.stringify(typedData),
            signature as string[],
            false
          );
          console.log('SIGNED_MESSAGE: published!')
        } catch (error) {
          console.error("useSdkPublishSignedMessage() failed to publish message:", error, typedData, signature);
        }
      } catch (error) {
        console.error("useSdkPublishSignedMessage() failed to sign message:", error, typedData);
      }

      console.log('ONLINE: done!')
      setIsPublishing(false)
    }
  }, [sdk, typedData, account])

  return {
    isPublishing,
    publish,
  }
}
