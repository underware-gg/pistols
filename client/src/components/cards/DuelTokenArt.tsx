import React from 'react'
import { BigNumberish } from 'starknet'
import { DuelTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useDuelTokenProps } from '/src/hooks/useDuelTokenSvg'

export function DuelTokenArt({
  duelId,
  className,
  style = {},
}: {
  duelId: BigNumberish,
  className?: string,
  style?: React.CSSProperties,
}) {
  const props = useDuelTokenProps(duelId)
  return <DuelTokenImage props={props} className={className} style={style} />
}
