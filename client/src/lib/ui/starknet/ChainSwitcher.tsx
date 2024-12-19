import React from 'react'
import { Dropdown } from 'semantic-ui-react'
import { useStarknetContext, ChainId } from '@underware_gg/pistols-sdk/dojo'
import { feltToString } from '@underware_gg/pistols-sdk/utils'

export function ChainSwitcher({
  disabled = false,
  fluid = false,
}) {
  const { chains, selectedChainConfig, selectChainId } = useStarknetContext()
  return (
    <Dropdown
      text={`Server:  ${selectedChainConfig.name}`}
      disabled={disabled}
      className='icon AlignCenter Padded'
      // icon='chain'
      button
      fluid={fluid}
    >
      <Dropdown.Menu>
        {chains.map(chain => (
          <Dropdown.Item key={chain.name} onClick={() => { selectChainId(feltToString(chain.id) as ChainId) }}>{chain.name}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
