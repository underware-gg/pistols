import React, { ReactNode, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { usePlayer } from '/src/stores/playerStore'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { SceneName } from '/src/data/assets'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { FoolsBalance } from './LordsBalance'

export default function AccountHeader() {
  const { isConnected } = useAccount()
  const { dispatchSetScene } = usePistolsScene()
  const { address } = useAccount()
  const { username } = usePlayer(address)
  const { duelistIds } = useDuelistsOfPlayer()
  
  const { aspectWidth } = useGameAspect()

  const _click = () => {
    dispatchSetScene(SceneName.Profile)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className='NoMouse' style={{ flex: 1, textAlign: 'right' }}>
        {!isConnected ? <h3>Guest</h3>
          : <>
            <h3>{username}</h3>
            <h5>
              <FoolsBalance address={address} />
              {/* Total Alive Duelists: {duelistIds.length} */}
              {/* TODO: Replace this with other info preferably multiple of them, ideas:
              - Total Duelists icon + number
              - FOOLS amount earned
              - Profile lvl once introduced
              - Total dead duelists?
              - IDEA: We could create special user flares, like earnable tags ex. "Pistol FLinger", "FOOLS Collector", "Blade Master", etc., that players could unlock with achievements or leveling up and we show it here and on profiles
              */}
            </h5>
          </>}
      </div>
      <div style={{ padding: aspectWidth(0.6) }}>
        {/* TODO replace with selkectedDuelist for profile pic */}
        <ProfilePic profilePic={0} medium removeBorder onClick={() => _click()} /> 
      </div>
    </div>
  );
}

// export function DuelistsNavigationMenu({
//   children,
// }: {
//   children: ReactNode,
// }) {
//   const { dispatchSetScene } = usePistolsScene()
//   const { duelistIds } = useDuelistsOfPlayer()
//   const { duelistId: selectedDuelistId } = useSettings()
//   const { dispatchDuelistId } = useSettings()
//   const { aspectWidth } = useGameAspect()

//   const _goToProfile = () => {
//     dispatchSetScene(SceneName.Profile)
//   }

//   const _switchDuelist = (duelistId: BigNumberish) => {
//     dispatchDuelistId(duelistId)
//   }

//   const maxItems = 6

//   const rows = useMemo(() => (
//     duelistIds.map((duelistId, index) => {
//       if (index > maxItems) return undefined
//       if (index == maxItems) return <Dropdown.Item key='more' text={'More Duelists...'} onClick={() => _goToProfile()} />
//       return (
//         <Dropdown.Item key={`i${duelistId}`}
//           onClick={() => _switchDuelist(duelistId)}
//           className={`NoPadding ${duelistId == selectedDuelistId ? 'BgImportant' : ''}`}
//         >
//           <DuelistItem duelistId={duelistId} />
//         </Dropdown.Item>
//       )
//     })
//   ), [duelistIds, selectedDuelistId])

//   return (
//     <Dropdown
//       className='NoPadding NoMargin'
//       direction='left'
//       simple
//       icon={null}
//       closeOnEscape
//       fluid
//       trigger={children}
//       style={{ width: aspectWidth(4), height: aspectWidth(4) }}
//     >
//       <Dropdown.Menu>
//         {rows}
//         <Dropdown.Item icon={'setting'} text={'Profile...'} onClick={() => _goToProfile()} />
//       </Dropdown.Menu>
//     </Dropdown>
//   )
// }

// export function DuelistItem({
//   duelistId,
// }: {
//   duelistId: BigNumberish
// }) {
//   // const { duelistId: selectedDuelistId } = useSettings()
//   // const isSelected = (duelistId && duelistId == selectedDuelistId)
//   const { profilePic, isInAction } = useDuelist(duelistId)

//   return (
//     <div className={'FlexInline'}>
//       <ProfilePic profilePic={profilePic ?? 0} small  />
//       <div className='PaddedSides'>
//         <ProfileName duelistId={duelistId} />
//         <br/>
//         <div className='Smaller'>
//           {/* //TODO replace with fame */}
//         </div>
//         {isInAction &&
//           <div className='AbsoluteRight Padded'>
//             <EmojiIcon emoji={EMOJI.IN_ACTION} />
//           </div>
//         }
//       </div>
//     </div>
//   )
// }

