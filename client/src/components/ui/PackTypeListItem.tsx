import React from 'react'
import { CardPack } from './CardPack'
import { FeesToPay } from '../account/LordsBalance'
import { useCalcFeePack } from '/src/hooks/usePistolsContractCalls'
import { usePackType } from '/src/stores/packStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useGameAspect } from '/src/hooks/useGameAspect'

interface PackTypeListItemProps {
  packType: number
  isSelected: boolean
  onClick: () => void
}

export const PackTypeListItem: React.FC<PackTypeListItemProps> = ({ 
  packType, 
  isSelected, 
  onClick 
}) => {
  const { name, quantity } = usePackType(packType)
  const { fee } = useCalcFeePack(packType)
  const { aspectWidth } = useGameAspect()
  
  return (
    <div 
      className={`packTypeItem ${isSelected ? 'active' : ''}`}
      onClick={onClick}
    >
      {isSelected && <div className="selectedIndicator"></div>}
      <div className="packTypeItemContent">
        <div className="packPreview" style={{ width: aspectWidth(10), height: aspectWidth(10) }}>
          <CardPack 
            packType={packType} 
            isOpen={true}
            clickable={false}
            cardPackSize={8}
            maxTilt={20}
          />
        </div>
        <div className="packInfo">
          <h3 className="packName">{name}</h3>
          <div className="packDetails">
            <span className="packQuantity">Contains {quantity} cards</span>
            <div className="packFee">
              <FeesToPay value={0} fee={fee} prefixed size="big" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// A tentacle slithers sneakily in the shadows of the pack 🐙 