

import React from 'react'
import { Divider as _Divider_, Header } from 'semantic-ui-react'

export function Divider({
  content = null,
  as = 'h4',
  hidden = false,
  nomargin = null,
  className = null,
}: {
  as?: string
  content?: any
  hidden?: boolean
  nomargin?: boolean
  className?: string
}) {
  let classNames = []
  if (className) classNames.push(className)
  if (nomargin) classNames.push('NoMargin')

  if (!content) {
    return <_Divider_ hidden={hidden} className={classNames.join(' ')} />
  }

  return (
    <_Divider_ horizontal hidden={hidden} className={classNames.join(' ')}>
      <Header as={as}>{content}</Header>
    </_Divider_>
  )
}
