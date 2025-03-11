// import React from 'react'
// import { Dropdown } from 'semantic-ui-react'
// import { useStarknetContext, ChainId } from '@underware/pistols-sdk/dojo'
// import { feltToString } from '@underware/pistols-sdk/utils'

// export function ChainSwitcher({
//   disabled = false,
//   fluid = false,
// }) {
//   const { chains, selectedNetworkConfig, selectChainId } = useStarknetContext()
//   return (
//     <Dropdown
//       text={`Server:  ${selectedNetworkConfig.name}`}
//       disabled={disabled}
//       className='icon AlignCenter Padded'
//       // icon='chain'
//       button
//       fluid={fluid}
//     >
//       <Dropdown.Menu>
//         {chains.map(chain => (
//           <Dropdown.Item key={chain.id} onClick={() => { selectChainId(feltToString(chain.id) as ChainId) }}>{chain.name}</Dropdown.Item>
//         ))}
//       </Dropdown.Menu>
//     </Dropdown>
//   )
// }
