import React from 'react'
import { BigNumberish } from 'starknet'
import { DuelistTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useDuelistTokenProps } from '/src/hooks/useDuelistTokenSvg'

export function DuelistTokenArt({
  duelistId,
  className,
  style = {},
}: {
  duelistId: BigNumberish,
  className?: string,
  style?: React.CSSProperties,
}) {
  const props = useDuelistTokenProps(duelistId)
  return <DuelistTokenImage props={props} className={className} style={style} />
}
