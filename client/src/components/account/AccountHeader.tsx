import React, { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useConnectedController } from '@underware/pistols-sdk/dojo'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { SceneName } from '/src/data/assets'
import { FoolsBalance } from '/src/components/account/LordsBalance'
import { usePlayerAvatar } from '/src/stores/playerStore'

export default function AccountHeader() {
  const { isConnected } = useAccount()
  const { dispatchSetScene } = usePistolsScene()
  const { address } = useAccount()
  const { username } = useConnectedController()
  const { avatarUrl } = usePlayerAvatar(address)

  const handleClick = () => {
    dispatchSetScene(SceneName.Profile)
  }

  

  return (
    <div 
      onClick={handleClick} 
      className="YesMouse AccountHeaderContainer"
    >
      <div className="RightHighlight" />
      
      <div className="AccountInfo">
        {!isConnected ? (
          <h3 className="Username">Guest</h3>
        ) : (
          <>
            <h3 className="Username">{username}</h3>
            <h5 className="Info">
              <FoolsBalance address={address} />
            </h5>
          </>
        )}
      </div>
      
      <div className="ProfileContainer">
        <ProfilePic 
          profilePic={avatarUrl ? undefined : 0} 
          profilePicUrl={avatarUrl} 
          medium 
          borderColor="rgba(120, 60, 190, 0.8)"
          borderWidth={0.15}
        />
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
//             <EmojiIcon emoji={EMOJIS.IN_ACTION} />
//           </div>
//         }
//       </div>
//     </div>
//   )
// }

