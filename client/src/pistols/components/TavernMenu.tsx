import React, { useMemo } from 'react'
import { Grid, Menu, Label, Tab, TabPane } from 'semantic-ui-react'
import { useQueryContext } from '@/pistols/hooks/QueryContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { IRLTournamentTab } from '@/pistols/components/tournament/IRLTournamentTab'
import { DuelistTable } from '@/pistols/components/DuelistTable'

const Row = Grid.Row
const Col = Grid.Column

const _makeBubble = (count) => {
  if (count > 0) {
    return (
      <Label className='Smaller' floating>
        {count}
      </Label>
    )
  }
  return null
}

export function TavernMenu() {
  // const { tableId } = useSettings()
  // const { tavernMenuItems } = usePistolsContext()
  // const { atTavern, currentScene, dispatchSetScene } = usePistolsScene()
  // const { isTournament, isIRLTournament } = useTable(tableId)

  // const {
  //   queryLiveDuels: { liveCount: liveDuelsCount },
  //   // queryYourDuels: { liveCount: yourDuelsCount },
  // } = useQueryContext()

  // const panes = useMemo(() => {
  //   let result = []
  //   tavernMenuItems.forEach(key => {
  //     if (key === SceneName.Tournament && !isTournament) return
  //     if (key === SceneName.IRLTournament && !isIRLTournament) return
  //     const bubble = (key == SceneName.Duels) ? _makeBubble(yourDuelsCount) : null
  //     result.push({
  //       key,
  //       menuItem: (
  //         <Menu.Item
  //           key={key}
  //           onClick={() => dispatchSetScene(key as SceneName)}
  //         >
  //           {key}
  //           {bubble}
  //         </Menu.Item>
  //       ),
  //       render: () => (
  //         <TabPane attached={true}>
  //           <div className='  '>
  //             {key === SceneName.Duelists && <DuelistTable />}
  //             {key === SceneName.Duels && <ChallengeTableYour />}
  //             {/* {key === SceneName.LiveDuels && <ChallengeTableLive />} */}
  //             {key === SceneName.Graveyard && <ChallengeTablePast />}
  //             {key === SceneName.Tournament && <></>}
  //             {key === SceneName.IRLTournament && <IRLTournamentTab />}
  //           </div>
  //         </TabPane>
  //       )
  //     })
  //   })
  //   return result
  // }, [tavernMenuItems, yourDuelsCount, liveDuelsCount, isTournament, isIRLTournament])

  // const menuIndex = panes.findIndex(pane => (pane.key == currentScene))

  // if (atTavern) {
  //   return <></>
  // }

  // return (
  //   <div className='UIContainer'>
  //     <Tab activeIndex={menuIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={panes} />
  //   </div>
  // )
}

