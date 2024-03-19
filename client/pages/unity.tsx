import React from 'react'
import { Unity, useUnityContext } from 'react-unity-webgl'
import App from '@/lib/ui/App'
import { ActionButton } from '@/pistols/components/ui/Buttons';

export default function UnityPage() {

  const buildSuffix = '/unity/test1/Export'
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: `${buildSuffix}.loader.js`,
    dataUrl: `${buildSuffix}.data`,
    frameworkUrl: `${buildSuffix}.framework.js`,
    codeUrl: `${buildSuffix}.wasm`,
  });

  return (
    <App>
      <Unity className='UnityCanvas' unityProvider={unityProvider} />
      <SceneButton sendMessage={sendMessage} sceneName='Scene A' />
      <SceneButton sendMessage={sendMessage} sceneName='Scene B' />
      <SceneButton sendMessage={sendMessage} sceneName='Another Scene' />
     </App>
  )
}

function SceneButton({
  sceneName,
  sendMessage,
}) {
  const _select = () => {
    sendMessage('GameController', 'SetScene', sceneName);
  }
  return <ActionButton label={sceneName} onClick={() => _select()} />
}

