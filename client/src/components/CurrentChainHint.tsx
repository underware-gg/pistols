import React from 'react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { useConfig } from '/src/stores/configStore'
import { PACKAGE_VERSION } from '/src/utils/constants'

export default function CurrentChainHint() {
  const { connector } = useAccount()
  const { currentSeasonId } = useConfig()
  const { selectedNetworkConfig } = useDojoSetup()
  return (
    <>
      <div className='Code Disabled AbsoluteBottom Padded AlignLeft'>
        v{PACKAGE_VERSION}/S{currentSeasonId}
        <br />
        {selectedNetworkConfig.networkId}
        {'/'}
        {selectedNetworkConfig.slotName}
        {'/'}
        {connector?.id ?? 'disconnected'}
      </div>
    </>
  )
}
