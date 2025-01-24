import React from 'react'
import { ButtonGroup, Button } from 'semantic-ui-react'
import { SettingsActions, useSettings } from '/src/hooks/SettingsContext'


export function TutorialProgressDebug() {
  return (
    <ButtonGroup className='AbsoluteBottom' style={{left: '200px'}}>
      <TutorialProgressButton level={0} label='Tutorial: Not Started' />
      <TutorialProgressButton level={1} label='Level 1' />
      <TutorialProgressButton level={2} label='Level 2' />
    </ButtonGroup>
  )
}

function TutorialProgressButton({
  level,
  label,
}: {
  level: number
  label: string
}) {
  const { completedTutorialLevel, dispatchSetting } = useSettings()
  const _setLevel = () => {
    dispatchSetting(SettingsActions.TUTORIAL_LEVEL, level)
  }
  return (
    <Button toggle
      active={level == completedTutorialLevel}
      disabled={false}
      onClick={_setLevel}
    >
      {label}
    </Button>
  )
}

