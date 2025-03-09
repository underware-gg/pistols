import React, { ReactNode } from 'react'
import { Grid, Progress } from 'semantic-ui-react'
import { useGameAspect } from '/src/hooks/useGameAspect'

const Row = Grid.Row
const Col = Grid.Column

export default function ProgressBar({
  label,
  className = null,
  disabled = false,
  warning = false,
  negative = false,
  cold = false,
  neutral = false,
  percent = null,
  value = null,
  total = null,
  width = null,
  height = null,
  hideValue = false,
}) {
  const { aspectWidth } = useGameAspect()

  const _disabled = (disabled || (value === null && !percent))
  const _className = `NoMargin ${className}`

  return (
    <Grid verticalAlign='middle' style={{ width: aspectWidth(width ?? 10), height: aspectWidth(height ?? 2), margin: 0 }}>
      {label &&
        <Row style={{ width: '100%' }}>
          <Col textAlign='left' className='TitleCase NoMargin' style={{ height: '100%' }}>
            {label}
          </Col>
        </Row>
      }
      <Row style={{ width: '100%', height: '100%' }}>
        <Col textAlign='left' className='Relative' style={{ height: '100%' }}>
          <Progress
            disabled={_disabled}
            value={_disabled || hideValue ? null : value}
            progress={!_disabled && value !== null ? 'value' : true}
            percent={!_disabled ? percent : undefined}
            total={!_disabled ? total : undefined}
            className={_className + (hideValue ? ' hide-value' : '')}
            color={_disabled ? 'grey' : (neutral ? 'grey' : cold ? 'teal' : null)}
            warning={!_disabled && warning}
            error={!_disabled && negative}
            style={{ width: '100%', height: '100%', margin: 0, border: '1px solid rgba(0, 0, 0, 0.2)', boxShadow: '1px 1px 2px 0px rgba(0, 0, 0, 0.8)' }}
          />
        </Col>
      </Row>
    </Grid>
  )
}
