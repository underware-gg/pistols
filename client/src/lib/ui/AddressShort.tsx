import { useMemo } from 'react'
import { CopyIcon } from '@/lib/ui/Icons'
import { bigintToHex, shortAddress } from '@/lib/utils/type'

function AddressShort({
  address,
  suffix = '',
  copyLink = true,
}) {
  const _address = useMemo(() => (typeof address == 'bigint' ? `0x${address.toString(16)}` : address), [address])
  const display = useMemo(() => (_address ? shortAddress(_address) : '0x?'), [_address])
  return (
    <span className='Code'>
      {copyLink && <CopyIcon content={bigintToHex(address)} />} {suffix}{display} 
    </span>
  )
}

export {
  AddressShort,
}
