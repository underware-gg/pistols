import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useSimulateChances } from '@/pistols/hooks/useContractCalls'
import { useDuel } from '@/pistols/hooks/useDuel'
import { Action } from '@/pistols/utils/pistols'
import { EMOJI } from '@/pistols/data/messages'
import ProgressBar from '@/pistols/components/ui/ProgressBar'
import { honour } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export function ActionChances({
  duelId,
  roundNumber,
  action,
  isA = false,
  isB = false,
}) {
  const { duelistId } = useSettings()
  const { challenge: { duelistIdA, duelistIdB }, round1 } = useDuel(duelId)
  const {
    action_honour,
    duelist_honour,
    // crit
    crit_chances,
    crit_base_chance,
    crit_bonus,
    crit_match_bonus,
    crit_trickster_penalty,
    // hit
    hit_chances,
    hit_base_chance,
    hit_bonus,
    hit_injury_penalty,
    hit_trickster_penalty,
    // lethal
    lethal_chances,
    lethal_base_chance,
    lethal_lord_penalty,
  } = useSimulateChances(duelistId, duelId, roundNumber, action)
  const otherDuelistId = useMemo(() => (isA ? duelistIdB : duelistIdA), [isA, isB, duelistIdB, duelistIdA])
  const { crit_chances: other_crit_chances } = useSimulateChances(otherDuelistId, duelId, roundNumber, Action.Strong)

  // console.log(`CHANCES:`, action_honour, crit_chances, crit_bonus, hit_chances, hit_bonus, lethal_chances, lethal_chances)

  const executionLabel = useMemo(() => {
    if ([Action.Flee, Action.Steal, Action.Seppuku].includes(action)) {
      return 'Success'
    } else if ([Action.Fast, Action.Block].includes(action)) {
      return 'Crit'
    } else {
      return 'Execution'
    }
  }, [action])

  const _critChances = crit_chances == 100 ? (crit_chances - other_crit_chances) : crit_chances
  const _honourValue = (action_honour >= 0 ? action_honour : isA ? round1?.shot_a.honour : isB ? round1?.shot_b.honour : null) ?? 0
  // console.log(`HONOUR:`, action_honour, _honourValue)
  return (
    <>
      <ProgressBar disabled={!action}
        label={`${executionLabel}:`}
        percent={_critChances}
        includedExtraPercent={crit_bonus}
      />
      <ProgressBar disabled={!action}
        label={lethal_chances ? <span>Hit / <span className='Warning'>Lethal</span>:</span> : 'Hit:'}
        percent={hit_chances}
        includedInnerPercent={lethal_chances}
      />
      <ProgressBar disabled={!action} label='Honour:'
        value={_honourValue / 10} total={10}
        negative={action_honour >= 0 && action_honour < honour.TRICKSTER_START}
        warning={action_honour >= honour.TRICKSTER_START && action_honour < honour.LORD_START}
        cold={action_honour >= honour.LORD_START}
        neutral={action_honour < 0}
      />

      {action > 0 &&
        <Grid columns={'equal'}>
          <Row>
            <Col>
              Raw bonus and penalties. More info on the <a href='https://docs.underware.gg/pistols/advanced' target='_blank'>docs</a>.
            </Col>
          </Row>
          <Row className='H5 Bold'>
            <Col></Col>
            <Col>
              {EMOJI.LORD} {crit_bonus}% Crit Bonus
              <br />{crit_base_chance}% Crit Base Chances
              {(crit_match_bonus > 0) && <><br />{crit_match_bonus}% Crit Match Bonus</>}
              {(crit_trickster_penalty > 0) && <><br />{crit_trickster_penalty}% Trickster Penalty</>}
            </Col>
            <Col>
              {EMOJI.VILLAIN} {hit_bonus}% Hit Bonus
              <br />{hit_base_chance}% Hit Base Chances
              {(lethal_base_chance > 0) && <><br />{lethal_base_chance}% Hit Lethal Chances</>}
              {(hit_injury_penalty > 0) && <><br />{hit_injury_penalty}% Injury Penalty</>}
              {(hit_trickster_penalty > 0) && <><br />{hit_trickster_penalty}% Trickster Penalty</>}
              {(lethal_lord_penalty > 0) && <><br />{lethal_lord_penalty}% Lord Penalty</>}
            </Col>
            <Col></Col>
          </Row>
        </Grid>
      }
    </>
  )
}
