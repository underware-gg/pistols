import React from 'react'
import { useMemoAsync } from 'src/utils/hooks/useMemoAsync'
import { SvgRenderOptions } from '../tokens/types'
import { loadingSvg, errorSvg } from './loadingSvg'
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
  const { value: svg } = useMemoAsync<string>(async () => {
    return await duel_token.renderSvg(props, options)
  }, [props], loadingSvg, errorSvg)
  return (
    <img src={svg} className={className} style={style} />
  )
}
