import { useMemo } from 'react'
import { CopyIcon, CustomIcon } from '@/pistols/components/ui/Icons'
import { bigintToHex } from '@/pistols/utils/utils'

function Wager({
  coin = 1,
  value = 0,
}) {
  if (!value) return <></>
  return (
    <div className='Wager'>
      {/* <CustomIcon name='lords' logo color={'bisque'} centered={false} /> */}
      💰{value}
    </div>
  )
}

export {
  Wager,
}
