import React, { useEffect, useMemo, useState } from 'react'
import { Button, Container, Divider, TextArea } from 'semantic-ui-react'
import { useAllDuelistIds, useDuelist } from '@/pistols/hooks/useDuelist'
import { CopyIcon } from '@/pistols/components/ui/Icons'
import { bigintToHex } from '@/lib/utils/type'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }


export function Snapshots() {
  const [data, setData] = useState('')

  const _update = (newData: any[]) => {
    setData(JSON.stringify(newData, null, '  '))
  }

  return (
    <Container text>
      <SnapshotDuelists update={_update} />
      <Divider />
      <TextArea readOnly value={data} />
      <CopyIcon content={data} />
    </Container>
  );
}

function SnapshotDuelists({
  update,
}) {
  const { duelistIds, duelistCount } = useAllDuelistIds()
  const [duelists, setDuelists] = useState([])

  const [snapping, setSnapping] = useState(false)
  const canSnap = (duelistCount > 0 && (!snapping || duelists.length == duelistIds.length))

  useEffect(() => {
    if(snapping) {
      update(duelists)
    }
  }, [snapping, duelists])

  const _update = (duelist) => {
    const address = bigintToHex(duelist.address)
    setDuelists(o => (o.findIndex(v => (v.address == address)) == -1 ? [...o, duelist] : [...o]))
  }

  const loaders = useMemo(() => {
    let result = []
    if (snapping && duelists.length < duelistIds.length) {
      const address = duelistIds[duelists.length]
      // console.log(`...loaders`, duelists.length, address.toString(16))
      result.push(<SnapDuelist key={address} address={address} update={_update} />)
    }
    return result
  }, [snapping, duelistIds, duelists])

  const _start = () => {
    setSnapping(true)
    setDuelists([])
  }

  return (
    <>
      <Button disabled={!canSnap} onClick={() => _start()}>
        Duelists Snapshot ({duelistCount > 0 ? `${duelists.length}/${duelistCount}` : '...'})
      </Button>
      {loaders}
    </>
  );
}

export function SnapDuelist({
  address,
  update,
}) {
  const duelist = useDuelist(address)
  useEffect(() => {
    update({
      ...duelist,
      honourDisplay: undefined,
      isRegistered: undefined,
    })
  }, [duelist])
  return <></>
}
