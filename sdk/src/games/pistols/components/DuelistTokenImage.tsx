import React, { useMemo } from 'react'
import { SvgRenderOptions } from '../tokens/types'
import * as duelist_token from '../tokens/duelist'

export function DuelistTokenImage({
  props,
  className,
  style = {},
}: {
  props: duelist_token.DuelistSvgProps,
  className?: string,
  style?: React.CSSProperties,
}) {
  const options: SvgRenderOptions = {
    includeMimeType: true,
  }
  const svg = useMemo(() => (duelist_token.renderSvg(props, options)), [props])
  return (
    <img src={svg} className={className} style={style} />
  )
}
