import React, { ReactElement } from 'react'
import { Grid } from 'semantic-ui-react'

const Row = Grid.Row
const Col = Grid.Column

export function VStack(props: {
  className?: string
  children: ReactElement[]
}) {
  const _VStackRowType = React.createElement(VStackRow).type;
  return (
    <Grid colums='equal' textAlign='center' className='FillWidth' {...props}>
      {props.children.map((element, i) => {
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
  children: ReactElement[]
}) {
  return (
    <Row className='FillWidth' {...props}>
      {props.children.map((element, i) => {
        return (
          <Col key={`c${i}`} style={{ display: 'inline-block', flexGrow: '1' }} >
            {element}
          </Col>
        )
      })}
    </Row>
  )
}
