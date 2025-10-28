import React, { useEffect, useMemo, useRef } from 'react'
import { Modal } from 'semantic-ui-react'
import { Opener } from '/src/hooks/useOpener'
import { useSettings } from '/src/hooks/SettingsContext'
import { InteractibleComponent, InteractibleComponentHandle } from '/src/components/InteractibleComponent'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { CardColor } from '@underware/pistols-sdk/pistols/constants'
import { SceneName } from '/src/data/assetsTypes'
import { usePistolsScene } from '/src/hooks/PistolsContext'

export interface ModeSelectModalProps {
  opener: Opener
}

const POSTER_WIDTH = 25
const POSTER_HEIGHT = 60

const GAME_MODES = [
  {
    id: "unranked",
    title: "Casual Mode",
    description: "Casual duels without ranking pressure. Practice, experiment, and enjoy the game at your own pace with fellow duelists.",
    imagePath: "/images/ui/modes/bg_unranked.png",
    highlightColor: CardColor.GREEN,
    requirements: [
      "No ranking impact",
      "Play with any duelist",
      "FAME on the line",
      "Earn FOOLS as a reward for dueling"
    ]
  },
  {
    id: "ranked", 
    title: "Ranked Duel",
    description: "Compete against skilled players in ranked matches. Climb the leaderboards and prove your worth in the most competitive duels.",
    imagePath: "/images/ui/modes/bg_ranked.png",
    highlightColor: CardColor.RED,
    requirements: [
      "Affects your ranking",
      "Competitive gameplay",
      "Leaderboard progression",
      "Only duelists with 3 lives or more can enter",
      "To register a duelist you need to pay a fee in FOOLS"
    ]
  },
  {
    id: "singleplayer",
    title: "Single Player Duel",
    description: "Face off against AI opponents in classic duels. Perfect for honing your skills and testing new strategies without the pressure of real opponents.",
    imagePath: "/images/ui/modes/bg_singleplayer.png",
    highlightColor: CardColor.BLUE,
    requirements: [
      "AI opponents only",
      "FAME not on stake",
      "Perfect for practice",
      "No rewards distributed",
      "Win a dead Imp if your're the one that kills them!"
    ]
  },
];

const ModePoster = ({ mode, onClick }: { 
  mode: typeof GAME_MODES[0], 
  isSelected: boolean, 
  onClick: () => void 
}) => {
  const { aspectWidth, aspectHeight } = useGameAspect()

  const baseRef = useRef<InteractibleComponentHandle>(null)

  useEffect(() => {
    baseRef.current?.toggleIdle(true)
  }, [])

  return (
    <InteractibleComponent
      ref={baseRef}
      width={aspectWidth(POSTER_WIDTH)}
      height={aspectHeight(POSTER_HEIGHT)}
      isLeft={false}
      isFlipped={true}
      isVisible={true}
      isHighlightable={true}
      instantFlip={true}
      instantVisible={true}
      hasBorder={false}
      frontImagePath={"/images/ui/duel_paper.png"}
      defaultHighlightColor={mode.highlightColor}
      hasCenteredOrigin={true}
      onClick={onClick}
      childrenInFront={
        <div className="Poster" style={{ padding: aspectWidth(1) }}>
          <img
            src={mode.imagePath}
            alt={mode.title}
            style={{
              width: "100%",
              height: "40%",
              objectFit: "contain",
              padding: aspectWidth(0.4),
            }}
          />

          {/* Mode Description */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-evenly",
              height: "100%",
            }}
          >
            <div
              style={{
                padding: aspectWidth(1.5),
                margin: `${aspectHeight(1)} ${aspectWidth(0.5)}`,
                color: "#8B4513",
                fontSize: aspectWidth(1.1),
                lineHeight: 1.4,
                textAlign: "center",
                fontFamily: "serif",
                textShadow: "2px 2px 6px rgba(0,0,0,0.5)",
                fontWeight: "bold",
              }}
            >
              {mode.description}
            </div>

            {/* Requirements */}
            <div
              style={{
                width: "100%",
                padding: aspectWidth(1),
                margin: `${aspectHeight(1)} ${aspectWidth(0.5)}`,
                backgroundColor: "rgba(139, 69, 51, 0.18)",
                borderRadius: aspectWidth(0.2),
                border: `1px solid #8B4513`,
                color: "#654321",
                fontSize: aspectWidth(0.9),
                fontFamily: "serif",
                textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                transform: "rotate(1deg)",
                position: "relative",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: aspectHeight(1),
                  fontWeight: "bold",
                  color: "#8B4513",
                  fontSize: aspectWidth(0.9),
                }}
              >
                Gamemode information:
              </div>
              {mode.requirements.map((req, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: "left",
                    marginBottom: aspectHeight(0.3),
                    paddingLeft: aspectWidth(0.3),
                  }}
                >
                  • {req}
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}

export default function ModeSelectModal({ opener }: ModeSelectModalProps) {
  const isOpen = useMemo(() => opener.isOpen, [opener.isOpen])

  return <>{isOpen && <_ModeSelectModal opener={opener} />}</>
}

function _ModeSelectModal({ opener }: ModeSelectModalProps) {
  const { selectedMode, dispatchSetting, SettingsActions } = useSettings()
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSetScene } = usePistolsScene()
  
  const handleModeSelect = (modeId: string) => {
    dispatchSetting(SettingsActions.SELECTED_MODE, modeId)
    setTimeout(() => {
      opener.close()
      if (modeId !== 'singleplayer') {
        dispatchSetScene(SceneName.Matchmaking)
      }
    }, 300)
  }

  const _close = () => {
    opener.close()
  }

  return (
    <Modal
      basic
      size='fullscreen'
      onClose={() => _close()}
      open={opener.isOpen}
      closeOnEscape
      closeOnDimmerClick
    >
      <div className='ModeModalContainer NoMouse NoDrag'>
        <div className="ModeModal YesMouse NoDrag" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: aspectWidth(2),
        }}
        onClick={() => _close()}
        >
          {GAME_MODES.map((mode, index) => (
            <div 
              key={mode.id}
              style={{
                width: aspectWidth(POSTER_WIDTH),
                height: aspectHeight(POSTER_HEIGHT),
                position: 'relative'
              }}
            >
              <ModePoster
                mode={mode}
                isSelected={selectedMode === mode.id}
                onClick={() => handleModeSelect(mode.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
