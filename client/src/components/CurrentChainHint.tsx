import React from 'react'
import { useAccount } from '@starknet-react/core'
import { useStarknetContext } from '@underware/pistols-sdk/dojo'
import { useTableId } from '/src/stores/configStore'
import { PACKAGE_VERSION } from '/src/utils/constants'

export default function CurrentChainHint() {
  const { selectedNetworkId } = useStarknetContext()
  const { connector } = useAccount()
  const { tableId } = useTableId()
  return (
    <>
      <div className='Code Disabled AbsoluteBottom Padded AlignLeft'>
        v{PACKAGE_VERSION}
        <br />
        ({tableId})
        <br />
        {selectedNetworkId}
        {'/'}
        {connector?.id ?? 'off'}
      </div>
    </>
  )
}
