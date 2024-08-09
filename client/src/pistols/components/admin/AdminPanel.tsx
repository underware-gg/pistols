import React from 'react'
import { Button, Container, Divider, Tab } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ConfigForm, TableConfigForm } from '@/pistols/components/admin/TableConfigForm'
import { AddressShort } from '@/lib/ui/AddressShort'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'

export const AdminPanel = ({
}) => {
  const { address, isConnecting, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectOpener } = usePistolsContext()
  return (
    <Container>
      <div className='ModalText'>
        <StarknetConnectModal opener={connectOpener} />
        <Button disabled={isConnected || isConnecting} onClick={() => connectOpener.open()}>Connect</Button>
        &nbsp;&nbsp;
        <Button disabled={!isConnected || isConnecting} onClick={() => disconnect()}>Disconnect</Button>
        &nbsp;&nbsp;
        Admin Panel <span className='Disabled'>|</span> <AddressShort address={address} />
      </div>

      {isConnected && <>
        <Tab menu={{ secondary: true, pointing: true, attached: true }} panes={[
          {
            menuItem: 'Owners',
            render: () => <div>TODO</div>,
          },
          {
            menuItem: 'Config',
            render: () => <ConfigForm />,
          },
          {
            menuItem: 'TableConfig',
            render: () => <TableConfigForm />,
          },
        ]}>
        </Tab>
      </>}

      <Divider />

    </Container>
  );
}
