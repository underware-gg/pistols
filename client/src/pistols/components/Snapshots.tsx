import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Button, Container, Divider, TextArea } from 'semantic-ui-react'
import { useAllChallengeIds } from '@/pistols/hooks/useChallenge'
import { useChallenge } from '@/pistols/stores/challengeStore'
import { useDuelist, useAllDuelistsEntityIds, DuelistStoreSync } from '@/pistols/stores/duelistStore'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { CopyIcon } from '@/lib/ui/Icons'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'

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
  const { challengeIds, challengeCount } = useAllChallengeIds()
  const [challenges, setChallenges] = useState([])

  const [snapping, setSnapping] = useState(false)
  const canSnap = (challengeCount > 0 && (!snapping || challenges.length == challengeIds.length))

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
    if (snapping && challenges.length < challengeIds.length) {
      const duelId = challengeIds[challenges.length]
      result.push(<SnapChallenge key={duelId} duelId={duelId} update={_update} />)
    }
    return result
  }, [snapping, challengeIds, challenges])

  const _start = () => {
    setSnapping(true)
    setChallenges([])
  }

  return (
    <>
      <Button className='FillParent' disabled={!canSnap} onClick={() => _start()}>
        Challenges Snapshot ({challengeCount > 0 ? `${challenges.length}/${challengeCount}` : '...'})
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
