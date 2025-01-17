import React from 'react'
import { useSelectedChain } from '@underware_gg/pistols-sdk/dojo'
import { PACKAGE_VERSION } from '/src/utils/constants'

export default function CurrentChainHint() {
  const { selectedChainId } = useSelectedChain()
  return (
    <>
      <div className='Code Disabled AbsoluteBottomRight PaddedHalf AlignRight'>
        v{PACKAGE_VERSION}
        <br />
        {selectedChainId}
      </div>
    </>
  )
}
