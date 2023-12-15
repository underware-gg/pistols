import { Grid, Row, Col } from '@/pistols/components/ui/Grid'
import { HealthBar } from '@/pistols/components/ui/Bars'
import SettingsPanel from '@/pistols/components/ui/SettingsPanel'

function GameUI() {
  return (
    <div className='GameView NoMouse'>
      <Grid className='GameUITop YesMouse'>
        <Row>
          <Col width={4} className='NoPadding'>
          </Col>
          <Col width={8} className='UI'>
          </Col>
          <Col width={4} className='UI'>
          </Col>
        </Row>
      </Grid>

      <Grid className='GameUIBottom YesMouse'>
        <Row>
          <Col width={4} className='NoPadding'>
          </Col>
          <Col width={1} className='UI'>
          </Col>
          <Col width={6} className='UI'>
          </Col>
          <Col width={1} className='UI'>
            <HealthBar />
          </Col>
          <Col width={4} className='UI'>
            <div className='MapView'></div>
            <SettingsPanel />
          </Col>
        </Row>
      </Grid>
    </div>
  )
}

export default GameUI
