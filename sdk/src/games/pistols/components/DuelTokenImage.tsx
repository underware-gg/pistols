import React, { useMemo } from 'react'
import { SvgRenderOptions } from '../tokens/types'
import * as duel_token from '../tokens/duel'

export function DuelTokenImage({
  props,
  className,
  style = {},
}: {
  props: duel_token.DuelSvgProps,
  className?: string,
  style?: React.CSSProperties,
}) {
  const options: SvgRenderOptions = {
    includeMimeType: true,
  }
  const svg = useMemo(() => (duel_token.renderSvg(props, options)), [props])
  return (
    <img src={svg} className={className} style={style} />
  )
}
