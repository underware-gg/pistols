import React from 'react'
import { useSelectedChain } from '@underware_gg/pistols-sdk/dojo'
import { PACKAGE_VERSION } from '/src/utils/constants'
import { useTableId } from '/src/stores/configStore'

export default function CurrentChainHint() {
  const { selectedChainId } = useSelectedChain()
  const { tableId } = useTableId()
  return (
    <>
      <div className='Code Disabled AbsoluteBottomRight PaddedHalf AlignRight'>
        v{PACKAGE_VERSION}
        <br />
        ({tableId})
        <br />
        {selectedChainId}
      </div>
    </>
  )
}
