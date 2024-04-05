import React, { useMemo } from 'react'
import { Grid, Image, Dropdown, Icon } from 'semantic-ui-react'
import { useAccount, useDisconnect, useStarkProfile } from '@starknet-react/core'
import { useDojoChain } from '@/lib/dojo/hooks/useDojoChain'
import { LordsBalance } from '@/pistols/components/account/LordsBalance'
import { LordsFaucet } from '@/pistols/components/account/LordsFaucet'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { feltToString } from '@/lib/utils/starknet'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'

const Row = Grid.Row
const Col = Grid.Column

export default function WalletHeader({
}) {
  const { disconnect } = useDisconnect()
  const { account, address, connector, isConnected } = useAccount()
  const { connectedChainName } = useDojoChain()

  // BUG: https://github.com/apibara/starknet-react/issues/419
  // const { data, error, isLoading } = useStarkProfile({ address, enabled: false })
  // console.log(data)
  const data = { name: null, profilePicture: null }

  const name = useMemo(() => (data?.name ?? `Connected to ${connectedChainName}`), [data])
  const imageUrl = useMemo(() => (data?.profilePicture ?? connector?.icon?.dark ?? '/profiles/00_sq.jpg'), [data, connector])

  return (
    <Grid>
      <Row>
        <Col width={2} verticalAlign='middle'>
          <Image src={imageUrl} className='ProfilePicSquare' />
        </Col>
        <Col width={9} textAlign='left' className='TitleCase Padded'>
          <h4>{name}</h4>
          <AddressShort address={address ?? 0n} />
          {isConnected && <>
            <h5>LORDS balance: <LordsBalance address={address} big={false} /></h5>
          </>}
        </Col>
        <Col width={5} verticalAlign='middle'>
          <LordsFaucet fill large account={account} />
          <ChainSwitcher />
          <ActionButton fill large onClick={() => disconnect()} label='Disconnect' />
        </Col>
      </Row>
    </Grid>
  )
}


function ChainSwitcher({
}) {
  const { chains, selectedChainConfig, selectChainId } = useStarknetContext()
  return (
    <Dropdown
      text={selectedChainConfig.name}
      className='icon AlignCenter Padded'
      icon='chain'
      button
      fluid
    >
      <Dropdown.Menu>
        {chains.map(chain => (
          <Dropdown.Item key={chain.name} onClick={() => { selectChainId(feltToString(chain.id) as CHAIN_ID) }}>{chain.name}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

