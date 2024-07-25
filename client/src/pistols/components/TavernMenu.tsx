import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Menu, Label, Tab, TabPane } from 'semantic-ui-react'
import { useQueryContext } from '@/pistols/hooks/QueryContext'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { IRLTournamentTab } from '@/pistols/components/tournament/IRLTournamentTab'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import { MusicToggle } from '@/pistols/components/ui/Buttons'
import { IconClick } from '@/lib/ui/Icons'
import AccountHeader from '@/pistols/components/account/AccountHeader'

const Row = Grid.Row
const Col = Grid.Column

const _makeBubble = (count) => {
  if (count > 0) {
    return (
      <Label floating>
        {count}
      </Label>
    )
  }
  return null
}

export function TavernMenu({
}) {
  const router = useRouter()
  const { address } = useAccount()
  const { tableId, duelistId, isGuest } = useSettings()
  const { menuKey, tavernMenuItems, tableOpener, dispatchSetMenu } = usePistolsContext()
  const { description, isTournament, isIRLTournament } = useTable(tableId)

  const {
    queryLiveDuels: { liveCount: liveDuelsCount },
    queryYourDuels: { liveCount: yourDuelsCount },
  } = useQueryContext()

  // select initial tab
  const [started, setStarted] = useState<boolean>(false)
  useEffect(() => {
    if (!started) {
      setStarted(true)
      if (isGuest) {
        dispatchSetMenu(MenuKey.LiveDuels)
      } else if (isTournament) {
        dispatchSetMenu(MenuKey.Tournament)
      } else if (isIRLTournament) {
        dispatchSetMenu(MenuKey.IRLTournament)
      } else if (yourDuelsCount > 0) {
        dispatchSetMenu(MenuKey.YourDuels)
      } else {
        dispatchSetMenu(MenuKey.Duelists)
      }
    }
  }, [started, isGuest, yourDuelsCount, liveDuelsCount])

  const panes = useMemo(() => {
    let result = []
    tavernMenuItems.forEach(key => {
      if (key === MenuKey.Tournament && !isTournament) return
      if (key === MenuKey.IRLTournament && !isIRLTournament) return
      const bubble = (key == MenuKey.YourDuels) ? _makeBubble(yourDuelsCount) : (key == MenuKey.LiveDuels) ? _makeBubble(liveDuelsCount) : null
      result.push({
        key,
        menuItem: (
          <Menu.Item
            key={key}
            onClick={() => dispatchSetMenu(key as MenuKey)}
          >
            {key}
            {bubble}
          </Menu.Item>
        ),
        render: () => (
          <TabPane attached={true}>
            <div className='UIMenuTavernScroller'>
              {key === MenuKey.Duelists && <DuelistTable />}
              {key === MenuKey.YourDuels && <ChallengeTableYour />}
              {key === MenuKey.LiveDuels && <ChallengeTableLive />}
              {key === MenuKey.PastDuels && <ChallengeTablePast />}
              {key === MenuKey.Tournament && <></>}
              {key === MenuKey.IRLTournament && <IRLTournamentTab />}
            </div>
          </TabPane>
        )
      })
    })
    return result
  }, [tavernMenuItems, yourDuelsCount, liveDuelsCount, isTournament, isIRLTournament])

  const menuIndex = panes.findIndex(pane => (pane.key == menuKey))

  const _changeTable = () => {
    tableOpener.open()
  }

  return (
    <>
      <Grid>
        <Row className='ProfilePicHeight Unselectable'>
          <Col width={7} verticalAlign='top' className='TitleCase NoBreak Padded Relative'>
            <h2>Pistols at 10 Blocks</h2>
            <h3>
              <IconClick name='ticket' size={'small'} onClick={() => _changeTable()} />
              {' '}
              <b className='Smaller Important'>{description}</b>
            </h3>
          </Col>
          <Col width={9} textAlign='right'>
            <AccountHeader />
          </Col>
        </Row>
      </Grid>

      <div className='Relative'>

        <div className='AbsoluteRight PaddedDouble'>
          <MusicToggle />
          &nbsp;&nbsp;
          &nbsp;&nbsp;
          <IconClick name='sign out' size={'large'} onClick={() => router.push(`/gate`)} />
          &nbsp;&nbsp;&nbsp;
        </div>

        <Tab activeIndex={menuIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={panes} />
      </div>
    </>
  )
}
