import React from 'react'
import { Grid, Progress } from 'semantic-ui-react'

const Row = Grid.Row
const Col = Grid.Column

export default function ProgressBar({
  label,
  className = null,
  disabled = false,
  percent = null,
  value = null,
  total = null,
}: {
  label: string
  className?: string
  disabled?: boolean
  percent?: number
  value?: number
  total?: number
}) {
  return (
    <Grid verticalAlign='middle' className={className}>
      <Row style={{ height: '35px' }}>
        <Col width={4} textAlign='right' className='TitleCase'>
          {label}
        </Col>
        <Col width={12} textAlign='left'>
          <Progress
            disabled={disabled}
            progress={value !== null ? 'value' : true}
            percent={percent}
            value={value}
            total={total}
            className={`NoMargin`}
          />
        </Col>
      </Row>
    </Grid>
  )
}
