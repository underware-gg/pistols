import React, { useCallback, useMemo, useState } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { IconClick } from '/src/components/ui/Icons'
import ActivityAction, { ActionIcon } from '/src/components/ActivityAction'
import ActivityFeed from '/src/components/ActivityFeed'
import ActivityOnline from '/src/components/ActivityOnline'

enum PanelType {
  Closed = 'Closed',
  Activity = 'Activity',
  Online = 'Online',
  Action = 'Duel',
}

const PanelTitle = ({
  panelType,
  isActive,
  setPanelType,
}: {
  panelType: PanelType
  isActive: boolean
  setPanelType: (type: PanelType) => void
}) => {
  const className = (isActive ? 'Active Anchor' : 'Inactive Anchor ImportantHover')
  const name = (panelType == PanelType.Action ? ActionIcon(isActive) : panelType)
  // const name = type
  return (
    <span className={className} onClick={() => setPanelType(panelType)}>
      {name}
    </span>
  )
}

export const ActivityPanel = () => {
  const [panelType, setPanelType] = useState(PanelType.Activity)

  const isClosed = useMemo(() => (panelType === PanelType.Closed), [panelType])
  const inActivity = useMemo(() => (panelType === PanelType.Activity), [panelType])
  const inOnline = useMemo(() => (panelType === PanelType.Online), [panelType])
  const inAction = useMemo(() => (panelType === PanelType.Action), [panelType])

  const { atGate, atDoor, atDuel, atTutorial } = usePistolsScene()
  if (atGate || atDoor || atDuel || atTutorial) {
    return <></>
  }

  return (
    <div className={`${isClosed ? 'ActivityPanelCollapsed' : 'ActivityPanel'} Relative`}>
      <h3 className='TitleCase'>
        {<PanelTitle panelType={PanelType.Action} isActive={inAction} setPanelType={setPanelType} />}
        <span className={'Inactive'}>{` | `}</span>
        {<PanelTitle panelType={PanelType.Activity} isActive={inActivity} setPanelType={setPanelType} />}
        <span className={'Inactive'}>{` | `}</span>
        {<PanelTitle panelType={PanelType.Online} isActive={inOnline} setPanelType={setPanelType} />}
        {/* <span className={'Inactive'}>{` | `}</span> */}
        {/* {_panelTitle(PanelType.Action)} */}
      </h3>

      {!isClosed && <IconClick className='ActivityPanelIcon' name={'close'} onClick={() => setPanelType(PanelType.Closed)} />}

      <div className='ActivityFeed'>
        {inAction && <ActivityAction />}
        {inActivity && <ActivityFeed />}
        {inOnline && <ActivityOnline />}
      </div>
    </div>
  );
}

export default ActivityPanel;
