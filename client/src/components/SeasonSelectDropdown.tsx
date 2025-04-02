import React, { useMemo } from 'react'
import { Dropdown } from 'semantic-ui-react'
import { useConfig } from '/src/stores/configStore'
import { useAllSeasonIds } from '../stores/seasonStore'

export function SeasonSelectDropdown({
  seasonId,
  setSeasonId,
}: {
  seasonId: number
  setSeasonId: (seasonId: number) => void
}) {
  const { currentSeasonId } = useConfig()
  const { seasonIds } = useAllSeasonIds()

  const options = useMemo(() => [
    {
      key: 'ALL',
      value: 'ALL',
      text: 'All Seasons',
    },
    ...seasonIds.map((seasonId) => ({
    key: `${seasonId}`,
    value: `${seasonId}`,
    text: `Season ${seasonId}${seasonId === currentSeasonId ? ' (Current)' : ''}`,
  })),
  ], [seasonIds, currentSeasonId])

  return (
    <Dropdown
      // text={`Select Season`}
      className='icon AlignCenter Padded'
      value={seasonId ?? 'ALL'}
      options={options}
      onChange={(e, { value }) => setSeasonId(value === 'ALL' ? null : value as number)}
      // icon='chain'
      button
      fluid
    />
  )
}
