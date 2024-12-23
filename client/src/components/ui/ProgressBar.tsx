import React, { ReactNode } from 'react'
import { Grid, Progress } from 'semantic-ui-react'

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
  includedExtraPercent = null,
  includedInnerPercent = null,
  value = null,
  total = null,
}) {
  const _disabled = (disabled || (value === null && !percent))
  const _className = `NoMargin ${className}`
  return (
    <Grid verticalAlign='middle' className={`ChancesBar ${className}`}>
      <Row style={{ height: '25px' }}>
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
                warning={warning || Boolean(includedExtraPercent)}
                error={negative}
                color={neutral ? 'grey' : cold ? 'teal' : null}
              />
              {Boolean(includedExtraPercent) &&
                <div className='LethalBar BgImportant' style={{ width: `${percent - includedExtraPercent}%` }} />
              }
              {Boolean(includedInnerPercent) &&
                <div className='LethalBar' style={{ width: `${includedInnerPercent}%` }} />
              }
            </>
          }
        </Col>
      </Row>
    </Grid>
  )
}
