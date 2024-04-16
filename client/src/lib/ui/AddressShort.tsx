import { useMemo } from 'react'
import { CopyIcon } from '@/lib/ui/Icons'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

function AddressShort({
  address,
  pre = '',
  post = '',
  copyLink = true,
  important = false,
  ifExists = false,
}: {
  address: BigNumberish
  pre?: string
  post?: string
  copyLink?: boolean
  important?: boolean
  ifExists?: boolean
}) {
  const display = useMemo(() => (shortAddress(bigintToHex(address))), [address])
  let classNames = ['Code']
  if (important) classNames.push('Important')
  if (ifExists && BigInt(address ?? 0) == 0n) return <></>
  return (
    <span className={classNames.join(' ')}>
      {pre} {display} {copyLink && address && <CopyIcon content={bigintToHex(address)} />} {post}
    </span>
  )
}

export {
  AddressShort,
}
