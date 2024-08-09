import React, { useMemo } from 'react'
import { Button, Container, Divider } from 'semantic-ui-react';
import { useAccount, useDisconnect } from '@starknet-react/core';
import { useDojoComponents } from '@/lib/dojo/DojoContext';
import { usePistolsContext } from '@/pistols/hooks/PistolsContext';
import { Component } from '@dojoengine/recs';
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import { TableConfigForm } from './TableConfigForm';

export const AdminPanel = ({
  children = null,
  className = null,
}) => {
  const { Config, TableConfig, TableAdmittance } = useDojoComponents()
  const { address, isConnecting, isConnected, connector, chainId } = useAccount()
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
        Admin Panel
        <Divider />
      </div>

      {isConnected && <>
        <TableConfigForm />
        <Divider />
      </>}

    </Container>
  );
}
