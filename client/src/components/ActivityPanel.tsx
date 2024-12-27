import React, { useMemo, useState } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { IconClick } from '/src/components/ui/Icons'
import ActivityFeed from '/src/components/ActivityFeed'
import ActivityPlayers from '/src/components/ActivityPlayers'

enum PanelType {
  Closed = 'Closed',
  Activity = 'Activity',
  Players = 'Players',
}

export const ActivityPanel = () => {
  const [panelType, setPanelType] = useState(PanelType.Activity)

  const isClosed = useMemo(() => (panelType === PanelType.Closed), [panelType])
  const isActivity = useMemo(() => (panelType === PanelType.Activity), [panelType])
  const isPlayers = useMemo(() => (panelType === PanelType.Players), [panelType])

  const { atGate, atDoor, atDuel } = usePistolsScene()
  if (atGate || atDoor || atDuel) {
    return <></>
  }

  return (
    <div className={`${isClosed ? 'ActivityPanelCollapsed' : 'ActivityPanel'} Relative`}>
      <h3 className='TitleCase'>
        <span className={isActivity ? 'Active Anchor' : 'Inactive Anchor ImportantHover'}
          onClick={() => setPanelType(PanelType.Activity)}
        >
          Activity
        </span>
        <span className={'Inactive'}>{` | `}</span>
        <span className={isPlayers ? 'Active Anchor' : 'Inactive Anchor ImportantHover'}
          onClick={() => setPanelType(PanelType.Players)}
        >
          Players
        </span>
      </h3>

      {!isClosed && <IconClick className='ActivityPanelIcon' name={'close'} onClick={() => setPanelType(PanelType.Closed)} />}

      <div className='ActivityFeed'>
        {isActivity && <ActivityFeed />}
        {isPlayers && <ActivityPlayers />}
      </div>
    </div>
  );
}

export default ActivityPanel;
