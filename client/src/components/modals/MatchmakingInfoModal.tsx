import React from 'react'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { constants } from '@underware/pistols-sdk/pistols/gen'

interface MatchmakingInfoModalProps {
  visible: boolean
  matchmakingType: constants.QueueId
}

export const MatchmakingInfoModal: React.FC<MatchmakingInfoModalProps> = ({
  visible,
  matchmakingType,
}) => {
  const { aspectWidth } = useGameAspect()

  if (!visible) return null

  return (
    <div
      className="matchmaking-info-popup"
      style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: aspectWidth(40),
        height: aspectWidth(33.8),
        padding: aspectWidth(1.2),
        background: "rgba(0, 0, 0, 0.88)",
        border: "3px solid #ce6f2c",
        borderRadius: aspectWidth(0.8),
        fontSize: aspectWidth(1.1),
        color: "#efe1d7",
        zIndex: 300,
        boxShadow:
          "0 12px 24px rgba(0,0,0,0.9), 0 0 20px rgba(206, 111, 44, 0.3)",
        fontFamily: "Garamond",
        lineHeight: 1.4,
        animation: "fadeInScale 0.3s ease-out",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: aspectWidth(1.6),
          fontWeight: "bold",
          color: "#ce6f2c",
          textAlign: "center",
          marginBottom: aspectWidth(0.8),
          textShadow: "0.1rem 0.1rem 2px rgba(0, 0, 0, 0.9)",
          letterSpacing: "0.1em",
        }}
      >
        🎯 MATCHMAKING SYSTEM
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: aspectWidth(1.5),
          marginBottom: aspectWidth(0.8),
        }}
      >
        <div>
          <strong style={{ color: "#ce6f2c", fontSize: aspectWidth(1.2) }}>
            What is Matchmaking?
          </strong>
          <br />
          <span style={{ fontSize: aspectWidth(0.95) }}>
            A system that pairs duelists for epic combat. Wait in queues,
            then face off in intense battles!
          </span>
        </div>

        <div>
          <strong style={{ color: "#ce6f2c", fontSize: aspectWidth(1.2) }}>
            Current Mode:
          </strong>
          <br />
          <span style={{ fontSize: aspectWidth(0.95) }}>
            <strong style={{ color: "#ce6f2c" }}>
              {matchmakingType === constants.QueueId.Ranked
                ? "RANKED"
                : "CASUAL"}
            </strong>
            {matchmakingType === constants.QueueId.Ranked
              ? " - Entry fee in FOOLS per duelist, climb the leaderboards for higher rewards! (Starter duelists not eligible)"
              : " - Free entry, duel with fellow players for excitement and FOOLS rewards!"}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: aspectWidth(0.8) }}>
        <strong style={{ color: "#ce6f2c", fontSize: aspectWidth(1.2) }}>
          Queue Timing Modes:
        </strong>
        <br />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: aspectWidth(1),
            marginTop: aspectWidth(0.4),
          }}
        >
          <div
            style={{
              padding: aspectWidth(0.6),
              background: "rgba(206, 111, 44, 0.1)",
              borderRadius: aspectWidth(0.3),
              border: "1px solid #ce6f2c",
            }}
          >
            <span style={{ color: "#ce6f2c", fontSize: aspectWidth(1.1) }}>
              ⚡ FAST MODE
            </span>
            <br />
            <span style={{ fontSize: aspectWidth(0.9) }}>
              5 minutes wait → Imp Duel
              <br />
              Only one entry at time, quick matchmaking, face an Imp if you
              don't get a match
            </span>
          </div>
          <div
            style={{
              padding: aspectWidth(0.6),
              background: "rgba(206, 111, 44, 0.1)",
              borderRadius: aspectWidth(0.3),
              border: "1px solid #ce6f2c",
            }}
          >
            <span style={{ color: "#ce6f2c", fontSize: aspectWidth(1.1) }}>
              🐌 SLOW MODE
            </span>
            <br />
            <span style={{ fontSize: aspectWidth(0.9) }}>
              24 hours wait → Imp Duel
              <br />
              Enter with unlimited number of duelists, and come back the
              next day to a lot of duels!
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: aspectWidth(0.8) }}>
        <strong style={{ color: "#ce6f2c", fontSize: aspectWidth(1.2) }}>
          How It Works:
        </strong>
        <br />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: aspectWidth(0.8),
            marginTop: aspectWidth(0.4),
          }}
        >
          <div style={{ textAlign: "center", fontSize: aspectWidth(0.9) }}>
            <div style={{ color: "#ce6f2c", fontWeight: "bold" }}>
              1. SELECT
            </div>
            Select the mode by selecting fast or slow
          </div>
          <div style={{ textAlign: "center", fontSize: aspectWidth(0.9) }}>
            <div style={{ color: "#ce6f2c", fontWeight: "bold" }}>
              2. WAIT
            </div>
            Once ready click on the bell to enter the queue
          </div>
          <div style={{ textAlign: "center", fontSize: aspectWidth(0.9) }}>
            <div style={{ color: "#ce6f2c", fontWeight: "bold" }}>
              3. FIGHT
            </div>
            Match with another player or face an Imp automatically
          </div>
          <div style={{ textAlign: "center", fontSize: aspectWidth(0.9) }}>
            <div style={{ color: "#ce6f2c", fontWeight: "bold" }}>
              4. REPEAT
            </div>
            Repeat the process to improve your ranking or just for fun
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: aspectWidth(1),
          color: "#c8b6a8",
          fontStyle: "italic",
          textAlign: "center",
          padding: aspectWidth(0.6),
          borderTop: "2px solid #ce6f2c",
          background: "rgba(206, 111, 44, 0.1)",
          borderRadius: aspectWidth(0.3),
        }}
      >
        💀 <strong style={{ color: "#ce6f2c" }}>IMPORTANT:</strong>There is
        no cancellation once a duelist is entered! After wait time expires,
        you automatically face an Imp! Be ready!
      </div>
    </div>
  )
}
