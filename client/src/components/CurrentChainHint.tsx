import React from 'react'
import { useAccount } from '@starknet-react/core'
import { useStarknetContext } from '@underware/pistols-sdk/dojo'
import { useConfig } from '/src/stores/configStore'
import { PACKAGE_VERSION } from '/src/utils/constants'

export default function CurrentChainHint() {
  const { selectedNetworkId } = useStarknetContext()
  const { connector } = useAccount()
  const { currentSeasonId } = useConfig()
  return (
    <>
      <div className='Code Disabled AbsoluteBottom Padded AlignLeft'>
        v{PACKAGE_VERSION}
        <br />
        ({currentSeasonId})
        <br />
        {selectedNetworkId}
        {'/'}
        {connector?.id ?? 'off'}
      </div>
    </>
  )
}
