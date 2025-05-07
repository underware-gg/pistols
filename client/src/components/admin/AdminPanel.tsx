import React from 'react'
import { Button, Container, Divider, Tab } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ConfigForm } from '/src/components/admin/TableConfigForm'
import { OwnerForm } from '/src/components/admin/OwnerForm'
import { Address } from '/src/components/ui/Address'
import StarknetConnectModal from '/src/components/starknet/StarknetConnectModal'

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
        Admin Panel <span className='Disabled'>|</span> <Address address={address} />
      </div>

      {isConnected && <>
        <Tab menu={{ secondary: true, pointing: true, attached: true }} panes={[
          {
            menuItem: 'Admins',
            render: () => <OwnerForm />,
          },
          {
            menuItem: 'Config',
            render: () => <ConfigForm />,
          },
        ]}>
        </Tab>
      </>}

      <Divider />

    </Container>
  );
}
