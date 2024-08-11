import { useMemo } from 'react'
import { CopyIcon } from '@/lib/ui/Icons'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

function AddressShort({
  address,
  pre = '',
  post = '',
  copyLink = 'right',
  important = false,
  ifExists = false,

}: {
  address: BigNumberish
  pre?: string
  post?: string
  copyLink?: 'left' | 'right' | false
  important?: boolean
  ifExists?: boolean
}) {
  const display = useMemo(() => (shortAddress(bigintToHex(address))), [address])

  const classNames = useMemo(() => {
    let classNames = ['Code']
    if (important) classNames.push('Important')
    return classNames
  }, [important])

  const copyIcon = useMemo(() => (copyLink && address && <CopyIcon content={bigintToHex(address)} />), [copyLink, address])

  if (ifExists && BigInt(address ?? 0) == 0n) return <></>
  return (
    <span className={classNames.join(' ')}>
      {pre} {copyLink == 'left' && copyIcon}{display}{copyLink == 'right' && copyIcon} {post}
    </span>
  )
}

export {
  AddressShort,
}
