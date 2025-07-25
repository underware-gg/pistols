import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Grid, Button, Container, Divider, TextArea } from 'semantic-ui-react'
import { bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { useAllChallengesIds, useChallenge } from '/src/stores/challengeStore'
import { useDuelist, useAllDuelistIds } from '/src/stores/duelistStore'
import { useGetSeasonScoreboard, DuelistScore } from '/src/stores/scoreboardStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { SeasonChallengeStoreSync, SeasonScoreboardStoreSync } from '/src/stores/sync/SeasonEntityStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { SeasonSelectDropdown } from '/src/components/SeasonSelectDropdown'
import { CopyIcon, IconClick } from '/src/components/ui/Icons'
import AppDojo from '/src/components/AppDojo'


const Row = Grid.Row
const Col = Grid.Column

// serialize bigint types
//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

interface State {
  name: string,
  data: any,
  length: number,
  formatted: string,
  filename: string,
  initialize: (name: string, seasonId: number) => void;
  insert: (name: string, key: string, data: any | null) => void;
}

const createStore = () => {
  return create<State>()(immer((set, get) => ({
    name: '',
    data: {},
    length: 0,
    formatted: '',
    filename: '',
    initialize: (name: string, seasonId: number) => {
      set((state: State) => {
        state.name = name;
        state.data = {};
        state.length = 0;
        state.formatted = JSON.stringify(state.data, null, '  ');
        state.filename = `snapshot-${name}${seasonId ? `_Season${seasonId}` : ''}-${new Date().toISOString()}.json`;
      });
    },
    insert: (name: string, key: string, data: any) => {
      // console.log("snapshotStore() SET:", name, key, data)
      set((state: State) => {
        if (key != null && data != null) {
          state.data[key] = data;
        }
        state.length = Object.keys(state.data).length;
        state.formatted = JSON.stringify(state.data, null, '  ');
      });
    },
  })))
}

export const useStore = createStore();

export default function SnapshotPage() {
  return (
    <AppDojo>
      <InternalPageMenu />
      <InternalPageWrapper>
        <Snapshots />
      </InternalPageWrapper>
    </AppDojo>
  )
}

export function Snapshots() {
  const state = useStore((state) => state)

  const [seasonId, setSeasonId] = useState<number>(null)
  const seasonDuelIds = [] // TODO... make query per season
  const seasonDuelistIds = [] // TODO... make query per season
  const { duelIds: allDuelIds } = useAllChallengesIds()
  const { duelistIds: allDuelistIds } = useAllDuelistIds()
  const { seasonScoreboard } = useGetSeasonScoreboard(seasonId)
  // console.log("______________Snapshots:", seasonId, leaderboardScores)

  useEffect(() => {
    state.initialize('', 0)
  }, [seasonId])

  const _download = useCallback(() => {
    const blob = new Blob([state.formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.filename;
    a.click();
  }, [state.formatted, state.filename])

  return (
    <Container text>
      <SeasonChallengeStoreSync />
      <SeasonScoreboardStoreSync />
      <EntityStoreSync />

      <Grid>
        <Row columns={'equal'}>
          <Col>
            <SeasonSelectDropdown seasonId={seasonId} setSeasonId={setSeasonId} />
          </Col>
        </Row>
        <Row columns={'equal'}>
          <Col>
            <SnapshotDuelists seasonId={seasonId} duelistIds={seasonId ? seasonDuelistIds : allDuelistIds} seasonScoreboard={seasonScoreboard} />
          </Col>
          <Col>
            <SnapshotChallenges seasonId={seasonId} duelIds={seasonId ? seasonDuelIds : allDuelIds} />
          </Col>
        </Row>
      </Grid>

      <Divider />

      <TextArea readOnly value={state.formatted} />
      <span>
        <b>{state.length}:</b>
        &nbsp;
        <CopyIcon content={state.formatted} disabled={state.length == 0} />
        &nbsp;
        <IconClick name='download' onClick={_download} disabled={state.length == 0} />
        &nbsp;
        {state.filename}
      </span>
    </Container>
  );
}

const useSnapping = (name: string, seasonId: number, limit: number) => {
  const state = useStore((state) => state)
  const [snapping, setSnapping] = useState(false)

  const start = useCallback(() => {
    if (!snapping) {
      setSnapping(true)
      state.initialize(name, seasonId)
      console.log("______________START:", name)
    }
  }, [snapping, name])

  const count = useMemo(() => {
    return (state.name == name ? state.length : 0)
  }, [state.name, name, state.length])

  useEffect(() => {
    if (snapping && count == limit) {
      console.log("______________DONE:", name)
      setSnapping(false)
    }
  }, [snapping, count, limit])

  return {
    snapping,
    count,
    limit,
    start,
  }
}

//----------------------------------
function SnapshotDuelists({
  seasonId,
  duelistIds,
  seasonScoreboard,
}: {
  seasonId: number
  duelistIds: bigint[]
  seasonScoreboard: DuelistScore[]
}) {
  const { snapping, count, limit, start } = useSnapping('duelists', seasonId, duelistIds.length)
  const loaders = useMemo(() => (
    snapping ? duelistIds.map(duelistId => <SnapDuelist key={duelistId} seasonId={seasonId} duelistId={duelistId} seasonScoreboard={seasonScoreboard} />) : null
  ), [snapping, duelistIds])
  return (
    <>
      <Button className='FillParent' disabled={snapping} onClick={() => start()}>
        Duelists Snapshot ({limit > 0 ? `${count}/${limit}` : '...'})
      </Button>
      {loaders}
    </>
  );
}

export function SnapDuelist({
  duelistId,
  seasonId,
  seasonScoreboard,
}: {
  seasonId: number
  duelistId: bigint
  seasonScoreboard: DuelistScore[]
}) {
  const insert = useStore((state) => state.insert)
  const duelist = useDuelist(duelistId)
  const { balance_eth, lives } = useDuelistFameBalance(duelistId)
  const mounted = useMounted()
  useEffect(() => {
    if (mounted && duelist && seasonId && seasonScoreboard) {
      const leaderboardIndex = seasonScoreboard.findIndex(s => s.duelistId == duelistId)
      insert('duelist', bigintToDecimal(duelistId.toString()), {
        ...duelist,
        fame_balance: bigintToDecimal(balance_eth),
        fame_lives: lives,
        isValidDuelistId: undefined,
        exists: undefined,
        gender: undefined,
        characterType: undefined,
        status: {
          ...duelist.totals,
          honourDisplay: undefined,
          honourAndTotal: undefined,
          archetypeName: undefined,
        },
        ...(seasonId ? {
          [seasonId]: {
            score: seasonScoreboard[leaderboardIndex]?.points ?? 0,
            position: (leaderboardIndex >= 0 ? leaderboardIndex + 1 : 0),
          }
        } : {}),
      })
    }
  }, [mounted, duelist, seasonId, seasonScoreboard])
  return <></>
}




//----------------------------------
// Challenge model
//
function SnapshotChallenges({
  seasonId,
  duelIds,
}: {
  seasonId: number
  duelIds: bigint[]
}) {
  const { snapping, count, limit, start } = useSnapping('challenges', seasonId, duelIds.length)
  const loaders = useMemo(() => (
    snapping ? duelIds.map(duelId => <SnapChallenge key={duelId} duelId={duelId} />) : null
  ), [snapping, duelIds])
  return (
    <>
      <Button className='FillParent' disabled={snapping} onClick={() => start()}>
        Challenges Snapshot ({limit > 0 ? `${count}/${limit}` : '...'})
      </Button>
      {loaders}
    </>
  );
}

export function SnapChallenge({
  duelId,
}) {
  const insert = useStore((state) => state.insert)
  const challenge = useChallenge(duelId)
  const mounted = useMounted()
  useEffect(() => {
    if (mounted && challenge) {
      insert('challenge', bigintToDecimal(duelId.toString()), {
        ...challenge,
        challengeExists: undefined,
        tutorialLevel: challenge.tutorialLevel ?? undefined,
        needToSyncExpired: undefined,
      })
    }
  }, [mounted, challenge])
  useEffect(() => {
  }, [mounted, challenge])
  return <></>
  // return <>{challenge?.duelId.toString()}</>
}
