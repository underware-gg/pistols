import { Grid as SemanticGrid } from 'semantic-ui-react'

function Grid(props) {
  const _props = {
    ...props,
    className: `${props.className ?? ''} NoPadding NoMargin`
  }
  return (
    <SemanticGrid {..._props} />
  )
}

function Row(props) {
  const _props = {
    ...props,
    className: `${props.className ?? ''} NoPadding`
  }
  return (
    <SemanticGrid.Row {..._props} />
  )
}

function Col(props) {
  const _props = {
    ...props,
    className: `${props.className ?? ''} NoPadding`
  }
  return (
    <SemanticGrid.Column {..._props} />
  )
}

export {
  Grid,
  Col,
  Row,
}
