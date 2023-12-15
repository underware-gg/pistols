import { useMemo } from 'react'

const shortAddress = (address) => (!address ? '?' : `${address.slice(0, 6)}…${address.slice(-4)}`)

function AccountShort({
  address
}) {
  const _address = useMemo(() => (typeof address == 'bigint' ? `0x${address.toString(16)}` : address), [address])
  const display = useMemo(() => (_address ? shortAddress(_address) : '0x?'), [_address])
  return (
    <span className='Code'>
      {display}
    </span>
  )
}

export {
  shortAddress,
  AccountShort,
}
