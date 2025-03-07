import React from 'react'
import { useStarknetContext } from '@underware_gg/pistols-sdk/dojo'
import { PACKAGE_VERSION } from '/src/utils/constants'
import { useTableId } from '/src/stores/configStore'

export default function CurrentChainHint() {
  const { selectedNetworkId } = useStarknetContext()
  const { tableId } = useTableId()
  return (
    <>
      <div className='Code Disabled AbsoluteBottom Padded AlignLeft'>
        v{PACKAGE_VERSION}
        <br />
        ({tableId})
        <br />
        {selectedNetworkId}
      </div>
    </>
  )
}
