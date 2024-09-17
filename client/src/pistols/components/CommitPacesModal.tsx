import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, ButtonGroup, Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { signAndGenerateMovesHash } from '@/pistols/utils/salt'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { feltToString } from '@/lib/utils/starknet'
import { BLADES_POINTS, BladesCard, getBladesCardFromValue, getBladesCardValue, getTacticsCardFromValue, getTacticsCardValue, TACTICS_POINTS, TacticsCard } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitPacesModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber = 1,
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber?: number
}) {
  const { account, chainId } = useAccount()
  const { duelistId } = useSettings()
  const { commit_moves } = useDojoSystemCalls()

  const [firePaces, setFirePaces] = useState(0)
  const [dodgePaces, setDodgePaces] = useState(0)
  const [tactics, setTactics] = useState(0)
  const [blades, setBlades] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFirePaces(0)
  }, [isOpen])

  const canSubmit = useMemo(() =>
    (account && duelId && roundNumber && firePaces && dodgePaces && firePaces != dodgePaces && tactics && blades && !isSubmitting),
    [account, duelId, roundNumber, firePaces, dodgePaces, tactics, blades, isSubmitting])

  const _submit = useCallback(async () => {
    if (canSubmit) {
      setIsSubmitting(true)
      const moves = [firePaces, dodgePaces, tactics, blades]
      const hash = await signAndGenerateMovesHash(account, feltToString(chainId), duelistId, duelId, roundNumber, moves)
      if (hash) {
        await commit_moves(account, duelistId, duelId, roundNumber, hash)
        setIsOpen(false)
      }
      setIsSubmitting(false)
    }
  }, [canSubmit])

  return (
    <Modal
      size='small'
      // dimmer='inverted'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter'>Choose your cards...</Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          <div className='ModalText'>
            <h5>Fire</h5>
            <PacesSelector currentPaces={firePaces} onSelect={(value: number) => setFirePaces(value)} />

            <Divider />
            <h5>Dodge</h5>
            <PacesSelector currentPaces={dodgePaces} onSelect={(value: number) => setDodgePaces(value)} />

            <Divider />
            <h5>Tactics</h5>
            <TacticsSelector currentTactics={tactics} onSelect={(value: number) => setTactics(value)} />

            <Divider />
            <h5>Blades</h5>
            <BladesSelector currentBlades={blades} onSelect={(value: number) => setBlades(value)} />
          </div>

        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill important label='Commit...' disabled={!canSubmit} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}


function PacesSelector({
  currentPaces,
  onSelect,
}: {
  currentPaces: number
  onSelect: (value: number) => void
}) {
  return (
    <Pagination
      size='huge'
      boundaryRange={10}
      defaultActivePage={null}
      ellipsisItem={null}
      firstItem={null}
      lastItem={null}
      prevItem={null}
      nextItem={null}
      siblingRange={1}
      totalPages={10}
      activePage={currentPaces}
      onPageChange={(e, { activePage }) => onSelect(typeof activePage == 'number' ? activePage : parseInt(activePage))}
    />
  )
}


const _points_list = (points: any) => {
  let result = []
  if (Math.abs(points?.self_chances ?? 0) > 0) result.push(<div key='self_chances'><b>Self Chances:</b> {points.self_chances}</div>)
  if (Math.abs(points?.self_damage ?? 0) > 0) result.push(<div key='self_damage'><b>Self Damage:</b> {points.self_damage}</div>)
  if (Math.abs(points?.other_chances ?? 0) > 0) result.push(<div key='other_chances'><b>Other Chances:</b> {points.other_chances}</div>)
  if (Math.abs(points?.other_damage ?? 0) > 0) result.push(<div key='other_damage'><b>Other Damage:</b> {points.other_damage}</div>)
  if (points?.special) result.push(<div key='special'><b>Special:</b> {points.special}</div>)
  return result
}

function TacticsSelector({
  currentTactics,
  onSelect,
}: {
  currentTactics: number
  onSelect: (value: number) => void
}) {
  const points = useMemo(() => {
    const tacticsName = getTacticsCardFromValue(currentTactics)
    return _points_list(TACTICS_POINTS[tacticsName])
  }, [currentTactics])
  return (
    <div>
      <ButtonGroup>
        {Object.keys(TacticsCard).slice(1).map(key => {
          let cardValue = getTacticsCardValue(key as TacticsCard)
          return (
            <Button key={key} toggle
              active={currentTactics === cardValue}
              onClick={() => onSelect(cardValue)}
            >
              {key}
            </Button>
          )
        })}
      </ButtonGroup>
      {points}
    </div>
  )
}

function BladesSelector({
  currentBlades,
  onSelect,
}: {
  currentBlades: number
  onSelect: (value: number) => void
}) {
  const points = useMemo(() => {
    const bladesName = getBladesCardFromValue(currentBlades)
    return _points_list(BLADES_POINTS[bladesName])
  }, [currentBlades])
  return (
    <div>
      <ButtonGroup>
        {Object.keys(BladesCard).slice(1).map(key => {
          let cardValue = getBladesCardValue(key as BladesCard)
          return (
            <Button key={key} toggle
              active={currentBlades === cardValue}
              onClick={() => onSelect(cardValue)}
            >
              {key}
            </Button>
          )
        })}
      </ButtonGroup>
      {points}
    </div>
  )
}
