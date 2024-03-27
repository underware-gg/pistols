import { ChildProcess } from 'child_process'
import React, { ReactElement, useMemo } from 'react'
import { Grid, GridProps } from 'semantic-ui-react'

const Row = Grid.Row
const Col = Grid.Column

export function VStack(props: GridProps & {
  className?: string
  children: ReactElement[]
}) {
  const elements = useMemo(() => (Array.isArray(props.children) ? props.children : [props.children]), [props.children])
  // const _VStackRowType = React.createElement(VStackRow).type;
  return (
    <Grid colums='equal' textAlign='center' className='FillWidth' {...props}>
      {elements.map((element, i) => {
        // if (element.type == _VStackRowType) { // breaks after re-render
        if (element.type.toString().startsWith('function VStackRow')) {
          return element
        }
        return (
          <Row key={`r${i}`}>
            <Col>
              {element}
            </Col>
          </Row>
        )
      })}
    </Grid>
  )
}

export function VStackRow(props: {
  className?: string
  children: ReactElement | ReactElement[]
}) {
  const elements = useMemo(() => (Array.isArray(props.children) ? props.children : [props.children]), [props.children])
  return (
    <Row className='FillWidth' {...props}>
      {elements.map((element, i) => {
        return (
          <Col key={`c${i}`} style={{ display: 'inline-block', flexGrow: '1' }} >
            {element}
          </Col>
        )
      })}
    </Row>
  )
}
