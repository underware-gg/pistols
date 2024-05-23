import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Menu, Label, Tab, TabPane, Icon } from 'semantic-ui-react'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { useChallengesByDuelistCount, useLiveChallengeIds } from '@/pistols/hooks/useChallenge'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useCurrentTable } from '@/pistols/hooks/useTable'
import { ChallengeTableYour, ChallengeTableLive, ChallengeTablePast } from '@/pistols/components/ChallengeTable'
import { DuelistTable } from '@/pistols/components/DuelistTable'
import { MusicToggle } from '@/pistols/components/ui/Buttons'
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
  const { accountAddress, isGuest } = useDojoAccount()
  const { menuKey, tavernMenuItems, dispatchSetMenu } = usePistolsContext()
  const { tableOpener } = usePistolsContext()

  const { awaitingCount, inProgressCount } = useChallengesByDuelistCount(accountAddress)
  const { challengeIds: liveChallengeIds } = useLiveChallengeIds()

  const yourDuelsCount = useMemo(() => (awaitingCount + inProgressCount), [awaitingCount, inProgressCount])
  const liveDuelsCount = useMemo(() => (liveChallengeIds.length), [liveChallengeIds])

  const [started, setStarted] = useState<boolean>(false)

  const { description } = useCurrentTable()

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
              {key === MenuKey.YourDuels && <ChallengeTableYour />}
              {key === MenuKey.LiveDuels && <ChallengeTableLive />}
              {key === MenuKey.PastDuels && <ChallengeTablePast />}
            </div>
          </TabPane>
        )
      })
    })
    return result
  }, [tavernMenuItems, yourDuelsCount, liveDuelsCount])

  const menuIndex = tavernMenuItems.findIndex(k => (k == menuKey))

  const _changeTable = () => {
    tableOpener.open()
  }

  return (
    <div>
      <Grid>
        <Row className='ProfilePicHeight'>
          <Col width={7} verticalAlign='middle' className='Title NoBreak'>
            &nbsp;&nbsp;&nbsp;<b>Pistols at 10 Blocks</b>
            <br />
            &nbsp;&nbsp;&nbsp;<b className='Important'>{description}</b> <Icon className='Anchor IconClick' name='ticket' size={'small'} onClick={() => _changeTable()} />
          </Col>
          <Col width={9} textAlign='right'>
            <AccountHeader />
          </Col>
        </Row>
      </Grid>

      <div className='Relative'>

        <div className='AbsoluteRight PaddedDouble'>
          <MusicToggle />
        </div>

        <Tab activeIndex={menuIndex} menu={{ secondary: true, pointing: true, attached: true }} panes={panes} />
      </div>
    </div>
  )
}
