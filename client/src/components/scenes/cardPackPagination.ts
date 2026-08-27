const PACKS_PER_PAGE = 20

export const getVisibleCardPackIds = ({
  packIds,
  currentPage,
  canClaimStarterPack,
}: {
  packIds: number[]
  currentPage: number
  canClaimStarterPack: boolean
}) => {
  const startIndex = currentPage * PACKS_PER_PAGE - (canClaimStarterPack && currentPage !== 0 ? 1 : 0)
  const pageSize = canClaimStarterPack && currentPage === 0 ? PACKS_PER_PAGE - 1 : PACKS_PER_PAGE
  const visible = packIds.slice(startIndex, Math.min(startIndex + pageSize, packIds.length))
  return canClaimStarterPack && currentPage === 0 ? [-1, ...visible] : visible
}

export const getRenderedCardPackIds = (
  visiblePackIds: number[],
  selectedCardPack: number | null,
) => {
  if (selectedCardPack == null || visiblePackIds.includes(selectedCardPack)) return visiblePackIds
  return [...visiblePackIds, selectedCardPack]
}

export const getCardPackPageCount = (packCount: number, canClaimStarterPack: boolean) => (
  Math.ceil((packCount + (canClaimStarterPack ? 1 : 0)) / PACKS_PER_PAGE)
)
