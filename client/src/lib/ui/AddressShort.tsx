import { useMemo } from 'react'
import { CopyIcon } from '@/lib/ui/Icons'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

function AddressShort({
  address,
  pre = '',
  post = '',
  copyLink = true,
}: {
  address: BigNumberish
  pre?: string
  post?: string
  copyLink?: boolean
}) {
  const display = useMemo(() => (shortAddress(bigintToHex(address))), [address])
  return (
    <span className='Code'>
      {pre} {display} {copyLink && address && <CopyIcon content={bigintToHex(address)} />} {post}
    </span>
  )
}

export {
  AddressShort,
}
