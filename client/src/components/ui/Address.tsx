import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { bigintToAddress, shortAddress } from '@underware/pistols-sdk/utils'
import { CopyIcon } from '/src/components/ui/Icons'

function Address({
  address,
  pre = '',
  post = '',
  copyLink = 'right',
  important = false,
  ifExists = false,
  full = false,
}: {
  address: BigNumberish
  pre?: string
  post?: string
  copyLink?: 'left' | 'right' | false
  important?: boolean
  ifExists?: boolean
  full?: boolean
}) {
  const isZero = useMemo(() => (BigInt(address ?? 0) == 0n), [address])

  const display = useMemo(() => (
    isZero ? '0x0' : full ? bigintToAddress(address) : shortAddress(bigintToAddress(address))
  ), [address, full])

  const classNames = useMemo(() => {
    let classNames = ['Code']
    if (important) classNames.push('Important')
    return classNames
  }, [important])

  const copyIcon = useMemo(() => (copyLink && address && <CopyIcon content={bigintToAddress(address)} />), [copyLink, address])

  if (ifExists && isZero) return <></>

  return (
    <span className={classNames.join(' ')} data-contentlength={Math.floor(display.length / 3)}>
      {pre} {copyLink == 'left' && copyIcon}{display}{copyLink == 'right' && copyIcon} {post}
    </span>
  )
}

export {
  Address,
}
