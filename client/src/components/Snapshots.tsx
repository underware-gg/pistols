import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Button, Container, Divider, TextArea } from 'semantic-ui-react'
import { useAllChallengesIds, useChallenge } from '/src/stores/challengeStore'
import { useDuelist, useAllDuelistsIds } from '/src/stores/duelistStore'
import { ChallengeStoreSync } from '/src/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { bigintEquals, bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { CopyIcon } from '/src/components/ui/Icons'
import { useGetSeasonScoreboard } from '../hooks/useScore'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Grid.Row
const Col = Grid.Column

export function Snapshots() {
  const [data, setData] = useState('')

  const _update = (newData: any[]) => {
    setData(JSON.stringify(newData, null, '  '))
  }

  return (
    <Container text>
      <ChallengeStoreSync />
      <EntityStoreSync />
      
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
  const { duelistIds } = useAllDuelistsIds()
  const [duelists, setDuelists] = useState([])

  const [snapping, setSnapping] = useState(false)
  const canSnap = (duelistIds.length > 0 && (!snapping || duelists.length == duelistIds.length))

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
    if (snapping && duelists.length < duelistIds.length) {
      const duelistId = duelistIds[duelists.length]
      // console.log(`...loaders`, duelists.length, address.toString(16))
      result.push(<SnapDuelist key={bigintToHex(duelistId)} duelistId={duelistId} update={_update} />)
    }
    return result
  }, [snapping, duelistIds, duelists])

  const _start = () => {
    setSnapping(true)
    setDuelists([])
  }

  return (
    <>
      <Button className='FillParent' disabled={!canSnap} onClick={() => _start()}>
        Duelists Snapshot ({duelistIds.length > 0 ? `${duelists.length}/${duelistIds.length}` : '...'})
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
  const score = useGetSeasonScoreboard(duelistId)
  useEffect(() => {
    update({
      ...duelist,
      score: {
        ...score,
        honourDisplay: undefined,
        honourAndTotal: undefined,
      }
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
  const { duelIds } = useAllChallengesIds()
  const [challenges, setChallenges] = useState([])

  const [snapping, setSnapping] = useState(false)
  const canSnap = (duelIds.length > 0 && (!snapping || challenges.length == duelIds.length))

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
    if (snapping && challenges.length < duelIds.length) {
      const duelId = BigInt(duelIds[challenges.length])
      result.push(<SnapChallenge key={duelId} duelId={duelId} update={_update} />)
    }
    return result
  }, [snapping, duelIds, challenges])

  const _start = () => {
    setSnapping(true)
    setChallenges([])
  }

  return (
    <>
      <Button className='FillParent' disabled={!canSnap} onClick={() => _start()}>
        Challenges Snapshot ({duelIds.length > 0 ? `${challenges.length}/${duelIds.length}` : '...'})
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
