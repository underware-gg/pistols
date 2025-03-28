import React, { useMemo } from 'react'
import { Dropdown } from 'semantic-ui-react'
import { useConfig } from '/src/stores/configStore'
import { useAllSeasonTableIds } from '/src/stores/tableStore'

export function SeasonSelectDropdown({
  tableId,
  setTableId,
}: {
    tableId: string
    setTableId: (tableId: string) => void
}) {
  const { seasonTableId } = useConfig()
  const { seasonTableIds } = useAllSeasonTableIds()
  // const seasonTableIds = ['Season1', 'Season2', 'Season3']

  const options = useMemo(() => [
    {
      key: 'ALL',
      value: 'ALL',
      text: 'All Seasons',
    },
    ...seasonTableIds.map((tableId) => ({
    key: `${tableId}`,
    value: `${tableId}`,
    text: `${tableId}${tableId === seasonTableId ? ' (Current)' : ''}`,
  })),
  ], [seasonTableIds])

  return (
    <Dropdown
      // text={`Select Season`}
      className='icon AlignCenter Padded'
      value={tableId ?? 'ALL'}
      options={options}
      onChange={(e, { value }) => setTableId(value === 'ALL' ? null : value as string)}
      // icon='chain'
      button
      fluid
    />
  )
}
