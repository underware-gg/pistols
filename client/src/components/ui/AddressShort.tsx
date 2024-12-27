import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { bigintToHex, shortAddress } from '@underware_gg/pistols-sdk/utils'
import { CopyIcon } from '/src/components/ui/Icons'

function AddressShort({
  address,
  pre = '',
  post = '',
  copyLink = 'right',
  important = false,
  ifExists = false,
  small = false,
}: {
  address: BigNumberish
  pre?: string
  post?: string
  copyLink?: 'left' | 'right' | false
  important?: boolean
  ifExists?: boolean
  small?: boolean
}) {
  const display = useMemo(() => (shortAddress(bigintToHex(address), small)), [address, small])

  const classNames = useMemo(() => {
    let classNames = ['Code']
    if (important) classNames.push('Important')
    return classNames
  }, [important])

  const copyIcon = useMemo(() => (copyLink && address && <CopyIcon content={bigintToHex(address)} />), [copyLink, address])

  if (ifExists && BigInt(address ?? 0) == 0n) return <></>
  return (
    <span className={classNames.join(' ')} data-contentlength={Math.floor(display.length / 3)}>
      {pre} {copyLink == 'left' && copyIcon}{display}{copyLink == 'right' && copyIcon} {post}
    </span>
  )
}

export {
  AddressShort,
}
