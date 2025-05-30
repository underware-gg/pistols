import { useCallback, useState } from 'react'
import { Account, TypedData, stark } from 'starknet'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { useStarknetContext } from 'src/dojo/contexts/StarknetProvider'
import { useConnectedController } from 'src/dojo/hooks/useController'
import { debug } from 'src/games/pistols/misc/debug'

export const useSdkPublishTypedData = (
  account: Account,
  typedData: TypedData,
) => {
  const { sdk, sdkConfig } = useDojoSetup()
  const { isControllerConnected } = useConnectedController()
  const { selectedNetworkConfig } = useStarknetContext()
  const [isPublishing, setIsPublishing] = useState<boolean>()

  const publish = useCallback(async () => {
    if (sdk && typedData && account) {
      if (!isControllerConnected) {
        console.warn('useSdkPublishSignedMessage() needs Cartridge Controller!')
        return
      }
      if (!sdkConfig.client.relayUrl) {
        console.error('useSdkPublishSignedMessage() failed: relayUrl is not set')
        return
      }
      if (isPublishing) {
        console.warn('useSdkPublishSignedMessage() still publishing...')
        return
      }

      setIsPublishing(true)

      // debug.log('ONLINE: publish...', typedData)
      // await sdk.sendMessage(typedData, account)

      try {
        // debug.log('SIGNED_MESSAGE: sign...', serialize(typedData), typedData)
        let signature = await account.signMessage(typedData);
        // debug.log('SIGNED_MESSAGE: signature:', signature)
        if (!Array.isArray(signature)) {
          signature = stark.formatSignature(signature)
        }

        try {
          debug.log(`SIGNED_MESSAGE: publish... (${signature.length})`)//, signature)
          await sdk.client.publishMessage(
            JSON.stringify(typedData),
            signature as string[],
          );
          debug.log('SIGNED_MESSAGE: published!')
        } catch (error) {
          console.error("useSdkPublishSignedMessage() failed to publish message:", error, typedData, signature);
        }
      } catch (error) {
        console.error("useSdkPublishSignedMessage() failed to sign message:", error, typedData);
      }

      // debug.log('SIGNED: done!')
      setIsPublishing(false)
    }
  }, [sdk, typedData, account, isControllerConnected])

  return {
    isPublishing,
    publish,
  }
}
