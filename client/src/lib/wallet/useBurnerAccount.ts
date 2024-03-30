import { useMemo } from 'react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { bigintEquals } from '../utils/types'


export const useBurnerAccount = (address) => {
  // const { walletSig, hasSigned, accountIndex, dispatchSetSig, dispatchSetAccountIndex, connectOpener } = usePistolsContext()
  const { list } = useDojoAccount()

  const [isDeployed, isImported] = useMemo(() => {
    const burner = list().reduce((a, v) => {
      if (a) return a
      return bigintEquals(v.address, address) ? v : null
    }, null)
    if (burner) {
      return [true, true]
    }

    // TODO: verify if deployed but not imported

    return [false, false]
  }, [address])

  return {
    isDeployed,
    isImported,
  }
}
