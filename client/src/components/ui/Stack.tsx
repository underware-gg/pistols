import React, { ReactElement, useMemo } from 'react'
import { Grid, GridProps } from 'semantic-ui-react'
import { Divider, DividerProps } from '@/components/ui/Divider'

const Row = Grid.Row
const Col = Grid.Column

export function VStack(props: GridProps & {
  className?: string
  children: ReactElement | ReactElement[]
}) {
  const elements = useMemo(() => (Array.isArray(props.children) ? props.children : [props.children]), [props.children])
  // const _VStackRowType = React.createElement(VStackRow).type;
  return (
    <Grid colums='equal' textAlign='center' className={`${props.className} FillWidth`} {...props}>
      {elements.map((element, i) => {
        // if (element.type == _VStackRowType) { // breaks after re-render
        if (element.type?.toString()?.startsWith('function VStackRow')) {
          return element
        }
        return (
          <Row key={`r${i}`} className='NoPadding'>
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


export function RowDivider(props: DividerProps) {
  return (
    <Row columns='1' className='NoPadding NoMargin' style={{ height: '25px' }}>
      <Col verticalAlign='middle'>
        <Divider {...props} />
      </Col>
    </Row>
  )
}
