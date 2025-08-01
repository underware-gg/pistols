import { useCallback, useState } from 'react'
import { Account, TypedData } from 'starknet'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { useConnectedController } from 'src/dojo/hooks/useController'
import { debug } from 'src/games/pistols/misc/debug'

export const useSdkPublishTypedData = (
  account: Account,
  typedData: TypedData,
) => {
  const { sdk } = useDojoSetup();
  const { isControllerConnected } = useConnectedController();
  const [isPublishing, setIsPublishing] = useState<boolean>();
  const [isSuccess, setIsSuccess] = useState<boolean>();

  const publish = useCallback(async () => {
    if (sdk && typedData && account) {
      if (!isControllerConnected) {
        console.warn('useSdkPublishSignedMessage() needs Cartridge Controller!');
        return;
      }
      if (isPublishing) {
        console.warn('useSdkPublishSignedMessage() still publishing...');
        return;
      }

      setIsPublishing(true);
      setIsSuccess(undefined);

      try {
        debug.log(`SIGNED_MESSAGE: publish...`, typedData);
        await sdk.sendMessage(typedData, account);
        setIsSuccess(true);
      } catch (error) {
        setIsSuccess(false);
        console.error("useSdkPublishSignedMessage() failed to publish message:", error, typedData);
      }
      setIsPublishing(false);
      // debug.log('SIGNED: done!')
    }
  }, [sdk, typedData, account, isControllerConnected])

  return {
    isPublishing,
    isSuccess,
    isError: (isSuccess === undefined ? undefined : isSuccess === false),
    publish,
  }
}
