import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Grid, Button, Container, Divider, TextArea } from 'semantic-ui-react'
import { bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { useAllChallengesIds, useChallenge } from '/src/stores/challengeStore'
import { useDuelist, useAllDuelistsIds } from '/src/stores/duelistStore'
import { useFameContract } from '/src/hooks/useTokenContract'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useTableTotals } from '/src/hooks/useTable'
import { useGetTableScoreboard } from '/src/hooks/useScore'
import { useDuelistFameBalance, fetchNewTokenBoundCoins } from '/src/stores/coinStore'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { ChallengeStoreSync } from '/src/stores/sync/ChallengeStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { InternalPageMenu } from '/src/pages/internal/InternalPageIndex'
import { SeasonSelectDropdown } from '/src/components/SeasonSelectDropdown'
import { CopyIcon, IconClick } from '/src/components/ui/Icons'
import AppDojo from '/src/components/AppDojo'
import { DuelistScore, useLeaderboard } from '/src/stores/tableStore'


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
  initialize: (name: string, domain: string) => void;
  insert: (name: string, key: string, data: any | null) => void;
}

const createStore = () => {
  return create<State>()(immer((set, get) => ({
    name: '',
    data: {},
    length: 0,
    formatted: '',
    filename: '',
    initialize: (name: string, domain: string) => {
      set((state: State) => {
        state.name = name;
        state.data = {};
        state.length = 0;
        state.formatted = JSON.stringify(state.data, null, '  ');
        state.filename = `snapshot-${name}${domain ? `_${domain}` : ''}-${new Date().toISOString()}.json`;
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
      <Snapshots />
    </AppDojo>
  )
}

export function Snapshots() {
  const state = useStore((state) => state)

  const [tableId, setTableId] = useState<string>(null)
  const { duelIds: tableDuelIds, duelistIds: tableDuelistIds } = useTableTotals(tableId)
  const { duelIds: allDuelIds } = useAllChallengesIds()
  const { duelistIds: allDuelistIds } = useAllDuelistsIds()
  const { scores: leaderboardScores } = useLeaderboard(tableId)
  // console.log("______________Snapshots:", tableId, leaderboardScores)

  useEffect(() => {
    state.initialize('', tableId)
  }, [tableId])

  const _download = useCallback(() => {
    const blob = new Blob([state.formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.filename;
    a.click();
  }, [state.formatted, state.filename])

  const { sdk } = useDojoSetup()
  const { fameContractAddress } = useFameContract()
  const { duelistContractAddress } = useDuelistTokenContract()
  fetchNewTokenBoundCoins(sdk, fameContractAddress, duelistContractAddress, allDuelistIds)

  return (
    <Container text>
      <ChallengeStoreSync />
      <EntityStoreSync />

      <Grid>
        <Row columns={'equal'}>
          <Col>
            <SeasonSelectDropdown tableId={tableId} setTableId={setTableId} />
          </Col>
        </Row>
        <Row columns={'equal'}>
          <Col>
            <SnapshotDuelists tableId={tableId} duelistIds={tableId ? tableDuelistIds : allDuelistIds} leaderboardScores={leaderboardScores} />
          </Col>
          <Col>
            <SnapshotChallenges tableId={tableId} duelIds={tableId ? tableDuelIds : allDuelIds} />
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

const useSnapping = (name: string, domain: string, limit: number) => {
  const state = useStore((state) => state)
  const [snapping, setSnapping] = useState(false)

  const start = useCallback(() => {
    if (!snapping) {
      setSnapping(true)
      state.initialize(name, domain)
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
  tableId,
  duelistIds,
  leaderboardScores,
}: {
  tableId: string
  duelistIds: bigint[]
  leaderboardScores: DuelistScore[]
}) {
  const { snapping, count, limit, start } = useSnapping('duelists', tableId, duelistIds.length)
  const loaders = useMemo(() => (
    snapping ? duelistIds.map(duelistId => <SnapDuelist key={duelistId} tableId={tableId} duelistId={duelistId} leaderboardScores={leaderboardScores} />) : null
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
  tableId,
  leaderboardScores,
}: {
  tableId: string
  duelistId: bigint
  leaderboardScores: DuelistScore[]
}) {
  const insert = useStore((state) => state.insert)
  const duelist = useDuelist(duelistId)
  const { balance_eth, lives } = useDuelistFameBalance(duelistId)
  const { points, isLoading } = useGetTableScoreboard(tableId, duelistId)
  const mounted = useMounted()
  useEffect(() => {
    if (mounted && duelist && (!tableId || !isLoading)) {
      const leaderboardIndex = leaderboardScores.findIndex(s => s.duelistId == duelistId)
      insert('duelist', bigintToDecimal(duelistId.toString()), {
        ...duelist,
        fame_balance: bigintToDecimal(balance_eth),
        fame_lives: lives,
        isValidDuelistId: undefined,
        exists: undefined,
        gender: undefined,
        characterType: undefined,
        status: {
          ...duelist.status,
          honourDisplay: undefined,
          honourAndTotal: undefined,
          archetypeName: undefined,
        },
        ...(tableId ? {
          [tableId]: {
            score: points,
            position: (leaderboardIndex >= 0 ? leaderboardIndex + 1 : 0),
          }
        } : {}),
      })
    }
  }, [mounted, duelist, isLoading, tableId, points, isLoading])
  return <></>
}




//----------------------------------
// Challenge model
//
function SnapshotChallenges({
  tableId,
  duelIds,
}: {
  tableId: string
  duelIds: bigint[]
}) {
  const { snapping, count, limit, start } = useSnapping('challenges', tableId, duelIds.length)
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
