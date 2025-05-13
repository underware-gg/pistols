import React from 'react'
import { useMemoAsync } from 'src/utils/hooks/useMemoAsync'
import { SvgRenderOptions } from '../tokens/types'
import { loadingSvg, errorSvg } from './loadingSvg'
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
  const { value: svg } = useMemoAsync<string>(async () => {
    return await duelist_token.renderSvg(props, options)
  }, [props], loadingSvg, errorSvg)
  return (
    <img src={svg} className={className} style={style} />
  )
}
