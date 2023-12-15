import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { Col, Grid, Row } from '@/pistols/components/ui/Grid'
import { SettingsButton } from '@/pistols/components/ui/Buttons'

function SettingsPanel() {
  const { settings, SettingsActions } = useSettingsContext()

  return (
    <Grid className='RowUI'>
      <Row stretched>
        <Col width={8} className='UI'>
          <SettingsButton prefix='Music' name={SettingsActions.MUSIC_ENABLED} value={settings.musicEnabled} />
        </Col>
        <Col width={8} className='UI'>
          <SettingsButton prefix='SFX' name={SettingsActions.SFX_ENABLED} value={settings.sfxEnabled} />
        </Col>
      </Row>
    </Grid>
  )
}

export default SettingsPanel
