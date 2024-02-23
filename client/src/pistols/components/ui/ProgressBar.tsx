import React, { ReactNode } from 'react'
import { Grid, Progress } from 'semantic-ui-react'

const Row = Grid.Row
const Col = Grid.Column

export default function ProgressBar({
  label,
  className = null,
  disabled = false,
  percent = null,
  glancePercent = null,
  value = null,
  total = null,
}: {
  label: string | ReactNode
  className?: string
  disabled?: boolean
  percent?: number
  glancePercent?: number
  value?: number
  total?: number
}) {
  const _disabled = (disabled || (!value && !percent))
  const _className = `NoMargin ${className}`
  return (
    <Grid verticalAlign='middle' className={className}>
      <Row style={{ height: '35px' }}>
        <Col width={4} textAlign='right' className='TitleCase'>
          {label}
        </Col>
        <Col width={12} textAlign='left' className='Relative'>
          {_disabled &&
            <Progress
              disabled={true}
              value={null}
              className={_className}
              color='grey'
            />
          }
          {!_disabled &&
            <>
              <Progress
                progress={value !== null ? 'value' : true}
                percent={percent}
                value={value}
                total={total}
                className={_className}
              />
              {Boolean(glancePercent) &&
                <div className='GlanceBar' style={{ width: `${glancePercent}%` }} />
              }
            </>
          }
        </Col>
      </Row>
    </Grid>
  )
}
