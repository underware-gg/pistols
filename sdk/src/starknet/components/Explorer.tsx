import React, { useMemo, ReactNode } from "react"
import { BigNumberish } from "starknet"
import { useExplorerContractUrl } from "../../utils/hooks/useExplorer"

export function ExplorerLink({
  address,
  children,
  cartridge,
  starkscan,
  viewblock,
  voyager,
}: {
  address: BigNumberish,
  children?: ReactNode,
  cartridge?: boolean,
  starkscan?: boolean,
  viewblock?: boolean,
  voyager?: boolean,
}) {
  const explorerType = useMemo(() => {
    if (cartridge) return 'cartridge'
    if (starkscan) return 'starkscan'
    if (viewblock) return 'viewblock'
    if (voyager) return 'voyager'
    return null
  }, [cartridge, starkscan, viewblock, voyager])
  const url = useExplorerContractUrl(address, explorerType)
  return (
    <a href={url ?? '#'} target={url ? '_blank' : undefined}>{children ?? explorerType ?? '<?explorer?>'}</a>
  )
}
