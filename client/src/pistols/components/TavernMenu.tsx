import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Menu, Label, Tab, TabPane } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { useChallengesByDuelistIdTotals, useLiveChallengeIds } from '@/pistols/hooks/useChallenge'
import { useCurrentTable } from '@/pistols/hooks/useTable'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
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
  const { duelistId, isGuest } = useSettings()
  const { menuKey, tavernMenuItems, tableOpener, dispatchSetMenu } = usePistolsContext()
  const { tableId, description } = useCurrentTable()

  const { liveDuelsCount: yourDuelsCount } = useChallengesByDuelistIdTotals(duelistId, tableId)
  const { challengeIds: liveChallengeIds } = useLiveChallengeIds(tableId)
  const liveDuelsCount = useMemo(() => (liveChallengeIds.length), [liveChallengeIds])

  const [started, setStarted] = useState<boolean>(false)

  useEffect(() => {
    if (!started) {
      setStarted(true)
      if (isGuest) {
        dispatchSetMenu(MenuKey.LiveDuels)
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
      const bubble = (key == MenuKey.YourDuels) ? _makeBubble(yourDuelsCount) : (key == MenuKey.LiveDuels) ? _makeBubble(liveDuelsCount) : null
      result.push({
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
              {key === MenuKey.YourDuels && <ChallengeTableYour tableId={tableId} />}
              {key === MenuKey.LiveDuels && <ChallengeTableLive tableId={tableId} />}
              {key === MenuKey.PastDuels && <ChallengeTablePast tableId={tableId} />}
            </div>
          </TabPane>
        )
      })
    })
    return result
  }, [tavernMenuItems, yourDuelsCount, liveDuelsCount, tableId])

  const menuIndex = tavernMenuItems.findIndex(k => (k == menuKey))

  const _changeTable = () => {
    tableOpener.open()
  }

  return (
    <div>
      <Grid>
        <Row className='ProfilePicHeight Unselectable'>
          <Col width={7} verticalAlign='middle' className='Title NoBreak'>
            &nbsp;&nbsp;&nbsp;<b>Pistols at 10 Blocks</b>
            <br />
            &nbsp;&nbsp;&nbsp;<IconClick name='ticket' size={'small'} onClick={() => _changeTable()} /> <b className='Smaller Important'>{description}</b>
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
          <IconClick name='sign out' size={'large'} onClick={() => router.push(`/gate`)} />
        </div>

        <Tab activeIndex={menuIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={panes} />
      </div>
    </div>
  )
}
