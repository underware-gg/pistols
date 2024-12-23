

import React, { useMemo } from 'react'
import { Divider as _Divider_, Header } from 'semantic-ui-react'

export type DividerProps = {
  as?: string
  content?: any
  vertical?: boolean
  hidden?: boolean
  nomargin?: boolean
  className?: string
}
export function Divider({
  content = null,
  as = 'h4',
  hidden = false,
  vertical = false,
  nomargin = null,
  className = null,
}: DividerProps) {
  const classNames = useMemo(() => {
    let classNames = []
    if (className) classNames.push(className)
    if (nomargin) classNames.push('NoMargin')
    return classNames
  }, [className, nomargin])

  if (!content) {
    return <_Divider_ hidden={hidden} vertical={vertical} className={classNames.join(' ')} />
  }

  return (
    <_Divider_ horizontal hidden={hidden} vertical={vertical} className={classNames.join(' ')}>
      <Header as={as}>{content}</Header>
    </_Divider_>
  )
}
