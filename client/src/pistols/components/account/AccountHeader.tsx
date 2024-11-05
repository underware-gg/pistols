import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { LordsBalance } from '@/pistols/components/account/LordsBalance'
import useGameAspect from '@/pistols/hooks/useGameApect'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader() {
  const { address, isConnected } = useAccount()
  const { isAnon, duelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { aspectWidth } = useGameAspect()

  const { nameDisplay, profilePic } = useDuelist(duelistId)

  const _click = () => {
    if (isAnon) {
      dispatchSetScene(SceneName.Profile)
    } else {
      dispatchSetScene(SceneName.Profile)
    }
  }

  return (
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1, textAlign: 'right' }}>
        {!isConnected ? <h3>Guest</h3>
          : <>
            <h3>{nameDisplay}</h3>
            <div style={{ lineHeight: 0 }}>
              <LordsBalance address={address} big /> 
            </div>
            {/* //TODO replace with fame */}
          </>}
      </div>
      <div style={{ padding: aspectWidth(0.6) }}>
        <ProfilePicSquareButton profilePic={profilePic ?? 0} onClick={() => _click()} medium />
      </div>
    </div>
  );
}
