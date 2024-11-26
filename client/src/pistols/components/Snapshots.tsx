import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Button, Container, Divider, TextArea } from 'semantic-ui-react'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useChallenge } from '@/pistols/stores/challengeStore'
import { useGetChallengesByTableQuery } from '@/pistols/hooks/useSdkQueries'
import { useDuelist, useAllDuelistsEntityIds, DuelistStoreSync } from '@/pistols/stores/duelistStore'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { CopyIcon } from '@/lib/ui/Icons'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { TABLES } from '@/games/pistols/generated/constants'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Grid.Row
const Col = Grid.Column

export function Snapshots() {
  const { isInitialized } = useDojoStatus()
  const [data, setData] = useState('')

  if (!isInitialized) {
    return <DojoStatus message={'Loading Pistols...'} />
  }

  const _update = (newData: any[]) => {
    setData(JSON.stringify(newData, null, '  '))
  }

  return (
    <Container text>
      <DuelistStoreSync />
      
      <Grid>
        <Row columns={'equal'}>
          <Col>
            <SnapshotDuelists update={_update} />
          </Col>
          <Col>
            <SnapshotChallenges update={_update} />
          </Col>
        </Row>
      </Grid>

      <Divider />
      
      <TextArea readOnly value={data} />
      <CopyIcon content={data} />
    </Container>
  );
}



//----------------------------------
// Duelist Model
//
function SnapshotDuelists({
  update,
}) {
  const { entityIds } = useAllDuelistsEntityIds()
  const [duelists, setDuelists] = useState([])

  const [snapping, setSnapping] = useState(false)
  const canSnap = (entityIds.length > 0 && (!snapping || duelists.length == entityIds.length))

  useEffect(() => {
    if(snapping) {
      update(duelists)
    }
  }, [snapping, duelists])

  const _update = (duelist) => {
    setDuelists(o => (o.findIndex(v => bigintEquals(duelist.address, v.address)) == -1 ? [...o, duelist] : [...o]))
  }

  const loaders = useMemo(() => {
    let result = []
    if (snapping && duelists.length < entityIds.length) {
      const duelistId = entityIds[duelists.length]
      // console.log(`...loaders`, duelists.length, address.toString(16))
      result.push(<SnapDuelist key={bigintToHex(duelistId)} duelistId={duelistId} update={_update} />)
    }
    return result
  }, [snapping, entityIds, duelists])

  const _start = () => {
    setSnapping(true)
    setDuelists([])
  }

  return (
    <>
      <Button className='FillParent' disabled={!canSnap} onClick={() => _start()}>
        Duelists Snapshot ({entityIds.length > 0 ? `${duelists.length}/${entityIds.length}` : '...'})
      </Button>
      {loaders}
    </>
  );
}

export function SnapDuelist({
  duelistId,
  update,
}) {
  const duelist = useDuelist(duelistId)
  useEffect(() => {
    update({
      ...duelist,
      honourDisplay: undefined,
      honourAndTotal: undefined,
      isRegistered: undefined,
    })
  }, [duelist])
  return <></>
}




//----------------------------------
// Challenge model
//
function SnapshotChallenges({
  update,
}) {
  const { challenges: allChallenges } = useGetChallengesByTableQuery(TABLES.LORDS)
  const [challenges, setChallenges] = useState([])

  const [snapping, setSnapping] = useState(false)
  const canSnap = (allChallenges.length > 0 && (!snapping || challenges.length == allChallenges.length))

  useEffect(() => {
    if (snapping) {
      update(challenges)
    }
  }, [snapping, challenges])

  const _update = (challenge) => {
    setChallenges(o => (o.findIndex(v => bigintEquals(challenge.duelId, v.duelId)) == -1 ? [...o, challenge] : [...o]))
  }

  const loaders = useMemo(() => {
    let result = []
    if (snapping && challenges.length < allChallenges.length) {
      const duelId = BigInt(allChallenges[challenges.length].duel_id)
      result.push(<SnapChallenge key={duelId} duelId={duelId} update={_update} />)
    }
    return result
  }, [snapping, allChallenges, challenges])

  const _start = () => {
    setSnapping(true)
    setChallenges([])
  }

  return (
    <>
      <Button className='FillParent' disabled={!canSnap} onClick={() => _start()}>
        Challenges Snapshot ({allChallenges.length > 0 ? `${challenges.length}/${allChallenges.length}` : '...'})
      </Button>
      {loaders}
    </>
  );
}

export function SnapChallenge({
  duelId,
  update,
}) {
  const challenge = useChallenge(duelId)
  useEffect(() => {
    update({
      ...challenge,
    })
  }, [challenge])
  return <></>
}
