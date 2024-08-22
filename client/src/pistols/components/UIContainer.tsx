import React, { ReactNode } from 'react'
import { Grid } from 'semantic-ui-react'

const Row = Grid.Row
const Col = Grid.Column

export default function UIContainer({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Grid className='UIContainer'>
      <Row columns={1} only='computer' className='UIContainerDesktop'>
        <Col>
          {children}
        </Col>
      </Row>
      <Row columns={1} only='tablet mobile' className='UIContainerMobile'>
        <Col>
          {children}
        </Col>
      </Row>
    </Grid>
  )
}
