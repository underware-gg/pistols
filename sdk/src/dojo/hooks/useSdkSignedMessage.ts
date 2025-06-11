import { useCallback, useState } from 'react'
import { Account, TypedData, stark } from 'starknet'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { useConnectedController } from 'src/dojo/hooks/useController'
import { debug } from 'src/games/pistols/misc/debug'

export const useSdkPublishTypedData = (
  account: Account,
  typedData: TypedData,
) => {
  const { sdk } = useDojoSetup()
  const { isControllerConnected } = useConnectedController()
  const [isPublishing, setIsPublishing] = useState<boolean>()

  const publish = useCallback(async () => {
    if (sdk && typedData && account) {
      if (!isControllerConnected) {
        console.warn('useSdkPublishSignedMessage() needs Cartridge Controller!')
        return
      }
      if (isPublishing) {
        console.warn('useSdkPublishSignedMessage() still publishing...')
        return
      }

      setIsPublishing(true)

      try {
        debug.log(`SIGNED_MESSAGE: publish..`, typedData);
        sdk.sendMessage(typedData, account);
      } catch (error) {
        console.error("useSdkPublishSignedMessage() failed to publish message:", error, typedData);
      }

      // try {
      //   // debug.log('SIGNED_MESSAGE: sign...', serialize(typedData), typedData)
      //   let signature = await account.signMessage(typedData);
      //   // debug.log('SIGNED_MESSAGE: signature:', signature)
      //   if (!Array.isArray(signature)) {
      //     signature = stark.formatSignature(signature)
      //   }

      //   try {
      //     debug.log(`SIGNED_MESSAGE: publish... len:${signature.length}`)//, signature)
      //     await sdk.client.publishMessage(
      //       JSON.stringify(typedData),
      //       signature as string[],
      //     );
      //     debug.log('SIGNED_MESSAGE: published!')
      //   } catch (error) {
      //     console.error("useSdkPublishSignedMessage() failed to publish message:", error, typedData, signature);
      //   }
      // } catch (error) {
      //   console.error("useSdkPublishSignedMessage() failed to sign message:", error, typedData);
      // }

      // debug.log('SIGNED: done!')
      setIsPublishing(false)
    }
  }, [sdk, typedData, account, isControllerConnected])

  return {
    isPublishing,
    publish,
  }
}
