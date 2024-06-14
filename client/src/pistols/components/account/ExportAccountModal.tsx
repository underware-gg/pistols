import React, { useMemo, useState } from 'react'
import { Grid, Modal, Image, Icon } from 'semantic-ui-react'
import { DojoPredeployedStarknetWindowObject } from '@rsodre/create-burner'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { useClipboard } from '@/lib/utils/hooks/useClipboard'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { useAccount } from '@starknet-react/core'
import { Opener } from '@/lib/ui/useOpener'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { VStack } from '@/lib/ui/Stack'
import { Divider } from '@/lib/ui/Divider'
import { AddressShort } from '@/lib/ui/AddressShort'
import { bigintEquals, isBigint } from '@/lib/utils/types'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column

export default function ExportAccountModal({
  opener,
  onImported,
}: {
  opener: Opener
  onImported: Function
}) {
  const { address, connector } = useAccount()
  const { playerId, replacePlayerId, requiresPlayerId } = usePlayerId()
  const { dispatchSetSig } = usePistolsContext()
  const { clipboard, writeToClipboard, readClipboard } = useClipboard(opener.isOpen)

  const canExport = useMemo(() => (requiresPlayerId), [requiresPlayerId])
  const canImport = useMemo(() => (requiresPlayerId && isBigint(clipboard) && BigInt(clipboard) > 0n), [requiresPlayerId, clipboard])
  const isExported = useMemo(() => (canImport && bigintEquals(clipboard, playerId)), [canImport, playerId, clipboard])

  // always closed on mount
  const mounted = useMounted(() => {
    opener.close()
  })

  const _export = () => {
    if (canExport) {
      writeToClipboard(playerId)
    }
  }
  const _import = () => {
    if (canImport && !isExported) {
      replacePlayerId(clipboard)
      dispatchSetSig(0n, 0n)
      onImported()
    }
  }

  return (
    <Modal
      size='small'
      // dimmer='inverted'
      onClose={() => opener.close()}
      open={mounted && opener.isOpen}
    >
      <Modal.Header>
        <Grid>
          <Row columns={'equal'}>
            <Col textAlign='center'>
              Export / Import Accounts
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content>
        <Modal.Description className='FillParent ModalText Centered'>
          <VStack>
            <div>
              Accounts are deterministic and attached to your wallet.
              <p>
                To play on another device, just <b>connect with the same wallet</b>
                <br />
                and <b>Deploy Duelist</b> to restore your duelists.
              </p>
            </div>
            <Divider />
            <div>
              <h5>Connected with <Image width='30' height='30' spaced src={connector?.icon.dark} /> {connector?.name}</h5>
            </div>
            <div>
              {!requiresPlayerId &&
                <div>
                  Account: <b><AddressShort important address={address} /></b>
                </div>
              }
              {requiresPlayerId &&
                <div>
                  This is a shared wallet <b>for testing only</b>.
                  <br />
                  Players are assigned a random ID for identification.
                  <Divider />
                  Your current ID: <b><AddressShort important address={playerId} copyLink={false} /></b>
                  <br />
                  {isExported ?
                    <>Current ID exported! Import on another session.</>
                    : !canImport ? <>Export new ID on another session or copy it to the clipboard.</>
                      : <>ID to be imported: <b><AddressShort important address={clipboard} copyLink={false} /></b></>
                  }
                </div>
              }
            </div>
          </VStack>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            {requiresPlayerId && <>
              <Col></Col>
              <Col>
                {/* <ActionButton fill onClick={() => writeToClipboard()} label={<>Export All <Icon name='copy' size='small' /></>} /> */}
                <ActionButton fill disabled={!canExport} label={<>Export <Icon name='copy' size='small' /></>} onClick={() => _export()} />
              </Col>
              <Col></Col>
              <Col>
                {/* <ActionButton fill onClick={() => applyFromClipboard()} label={<>Import All <Icon name='paste' size='small' /></>} /> */}
                <ActionButton fill disabled={!requiresPlayerId} label={<>Check <Icon name='paste' size='small' /></>} onClick={() => readClipboard()} />
              </Col>
              <Col>
                {/* <ActionButton fill onClick={() => applyFromClipboard()} label={<>Import All <Icon name='paste' size='small' /></>} /> */}
                <ActionButton fill disabled={!canImport || isExported} label={<>Import</>} onClick={() => _import()} />
              </Col>
            </>}
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

