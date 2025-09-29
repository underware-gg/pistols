import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '/src/hooks/SettingsContext'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { _currentScene } from '/src/three/game'
import { TextureName } from '/src/data/assets'
import { ActionButton } from '/src/components/ui/Buttons'
import { DuelistPlaceholderSlot, DuelistPlaceholderSlotHandle } from '/src/components/ui/DuelistPlaceholderSlot'
import { useDuelistsInMatchMaking } from '/src/stores/matchStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { ExclamationIndicator } from '../ui/ExclamationIndicator'
import { emitter } from '/src/three/game'
import { useDuellingDuelists } from '/src/stores/duelistStore'
import { usePlayerDuelistsOrganized } from '/src/stores/duelistStore'

export default function ScMatchmaking() {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { selectedMode, dispatchSetting } = useSettings()
  
  const [matchmakingType, setMatchmakingType] = useState<constants.QueueId>(constants.QueueId.Unranked);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Pagination state for slow duelists
  const [currentPage, setCurrentPage] = useState(0)
  // const duelistsPerPage = matchmakingType === constants.QueueId.Unranked ? 6 : 4
  const duelistsPerPage = 6;
  
  // Selected duelists state
  const [selectedFastDuelist, setSelectedFastDuelist] = useState<bigint | null>(null)
  const [selectedSlowDuelists, setSelectedSlowDuelists] = useState<bigint[]>([])
  const fastSlotRef = useRef<DuelistPlaceholderSlotHandle | null>(null)
  const slowSlotRefs = useRef<Map<number, DuelistPlaceholderSlotHandle>>(new Map())
  
  // Track individual duelist commit states
  const [committingDuelists, setCommittingDuelists] = useState<Set<bigint>>(new Set())

  const { activeDuelists: duelistIds } = usePlayerDuelistsOrganized();
  const { notDuelingIds } = useDuellingDuelists(duelistIds);

  const {
    // current queue
    inQueueIds,
    // ranked only
    rankedCanEnlistIds,
    rankedEnlistedIds,
    // all queues
    canMatchMakeIds,
    duellingIds,
    duelsByDuelistId,
  } = useDuelistsInMatchMaking(matchmakingType);
  const isRankedMode = matchmakingType === constants.QueueId.Ranked

  const queuedFastDuelistId = useMemo(() => {
    // if (!isRankedMode) return undefined
    // return inQueueIds[0]
    return undefined;
  }, [inQueueIds, isRankedMode])

  const queuedSlowIds = useMemo(() => {
    // if (!isRankedMode) return [...inQueueIds]
    // return queuedFastDuelistId !== undefined ? inQueueIds.slice(1) : [...inQueueIds]
    return [...inQueueIds];
  }, [inQueueIds, isRankedMode, queuedFastDuelistId])

  const totalUsedSlowSlots = queuedSlowIds.length + selectedSlowDuelists.length + duellingIds.filter(id => !queuedSlowIds.includes(id)).length

  const totalSlowSlots = useMemo(() => {
    if (totalUsedSlowSlots === 0) {
      return duelistsPerPage
    }
    const filledSlots = Math.ceil(totalUsedSlowSlots / duelistsPerPage) * duelistsPerPage
    return totalUsedSlowSlots % duelistsPerPage === 0 ? filledSlots + duelistsPerPage : filledSlots
  }, [totalUsedSlowSlots, duelistsPerPage])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalSlowSlots / duelistsPerPage)), [totalSlowSlots, duelistsPerPage])

  const slowSlotsData = useMemo(() => {
    const slots: Array<{ slotIndex: number; queuedId?: bigint; selectedId?: bigint; duellingId?: bigint; duelId?: bigint }> = []
    //TODO handle fast queue later!
    // First, add duelling duelists (immediate matches) - they get priority at the front
    const duellingDuelists = duellingIds.filter(id => !queuedSlowIds.includes(id))
    duellingDuelists.forEach((duelistId, index) => {
      const duelId = duelsByDuelistId[duelistId.toString()]
      slots.push({ 
        slotIndex: index, 
        duellingId: duelistId, 
        duelId: duelId ? BigInt(duelId) : undefined 
      })
    })
    
    // Then add queued duelists
    queuedSlowIds.forEach((duelistId, index) => {
      const slotIndex = duellingDuelists.length + index
      slots.push({ slotIndex, queuedId: duelistId, duelId: duelsByDuelistId[duelistId.toString()] ? BigInt(duelsByDuelistId[duelistId.toString()]) : undefined })
    })
    
    // Fill remaining slots with selected duelists
    let selectedIndex = 0
    for (let i = slots.length; i < totalSlowSlots; i++) {
      if (selectedIndex < selectedSlowDuelists.length) {
        slots.push({ slotIndex: i, selectedId: selectedSlowDuelists[selectedIndex] })
        selectedIndex++
      } else {
        // Empty slot
        slots.push({ slotIndex: i })
      }
    }
    
    return slots
  }, [totalSlowSlots, queuedSlowIds, selectedSlowDuelists, duellingIds, duelsByDuelistId])

  const unavailableBase = useMemo(() => {
    const unavailable = new Set<bigint>(selectedSlowDuelists)
    if (selectedFastDuelist) {
      unavailable.add(selectedFastDuelist)
    }
    return unavailable
  }, [selectedSlowDuelists, selectedFastDuelist])

  // Track if any duelists are committing
  const isAnyCommitting = committingDuelists.size > 0

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1))
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    const completedDuelists = new Set<bigint>()
    
    queuedSlowIds.forEach(id => completedDuelists.add(id))
    duellingIds.forEach(id => completedDuelists.add(id))
    
    if (completedDuelists.size === 0) return
    
    // Remove completed duelists from both selected and committing states
    setSelectedSlowDuelists(prev => {
      if (prev.length === 0) return prev
      const filtered = prev.filter(id => !completedDuelists.has(id))
      return filtered.length === prev.length ? prev : filtered
    })
    
    setCommittingDuelists(prev => {
      const newSet = new Set(prev)
      let hasChanges = false
      prev.forEach(id => {
        if (completedDuelists.has(id)) {
          newSet.delete(id)
          hasChanges = true
        }
      })
      return hasChanges ? newSet : prev
    })
  }, [queuedSlowIds, duellingIds])

  useEffect(() => {
    return
    if (!selectedFastDuelist) return
    if (queuedFastDuelistId !== undefined && selectedFastDuelist === queuedFastDuelistId) {
      setSelectedFastDuelist(null)
    }
  }, [queuedFastDuelistId, selectedFastDuelist])

  useEffect(() => {
    setSelectedFastDuelist(null)
    setSelectedSlowDuelists([])
    setCurrentPage(0)
    slowSlotRefs.current.clear()
  }, [matchmakingType])

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  const handleBellClick = () => {
    const commitFns: Array<() => void> = []
    const duelistsToCommit: bigint[] = []

    // Only process duelists that are NOT already committing
    const nonCommittingSlowDuelists = selectedSlowDuelists.filter(id => !committingDuelists.has(id))

    if (false && isRankedMode && selectedFastDuelist && queuedFastDuelistId === undefined) {
      const fastHandle = fastSlotRef.current
      if (fastHandle && fastHandle.isReady && !committingDuelists.has(selectedFastDuelist)) {
        commitFns.push(() => fastHandle.commitToQueue())
        duelistsToCommit.push(selectedFastDuelist)
      } else if (fastHandle?.enlistmentState.enlistError) {
        // Clear failed enlistment
        fastHandle.clearEnlistmentError()
        setSelectedFastDuelist(null)
      }
    }

    nonCommittingSlowDuelists.forEach((duelistId, index) => {
      // Find the correct slot index for this duelist in slowSlotsData
      const slotData = slowSlotsData.find(slot => slot.selectedId === duelistId)
      if (!slotData) {
        return
      }
      
      const slotIndex = slotData.slotIndex
      const slotHandle = slowSlotRefs.current.get(slotIndex)
      
      if (slotHandle && slotHandle.isReady) {
        commitFns.push(() => slotHandle.commitToQueue())
        duelistsToCommit.push(duelistId)
      } else if (slotHandle?.enlistmentState.enlistError) {
        // Clear failed enlistment
        slotHandle.clearEnlistmentError()
        handleSlowDuelistRemoved(duelistId)
      }
    })

    // Execute commit functions first, then add to committing state only if successful
    const successfulCommits: bigint[] = []
    
    commitFns.forEach((commit, index) => {
      try {
        commit()
        // If we get here without error, consider it successful
        successfulCommits.push(duelistsToCommit[index])
      } catch (error) {
        console.error('Commit function failed:', error)
      }
    })

    // Only add successfully started commits to committing state
    if (successfulCommits.length > 0) {
      setCommittingDuelists(prev => {
        const newSet = new Set(prev)
        successfulCommits.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  const handleSlowSlotSelected = (slotIndex: number, duelistId: bigint) => {
    const targetIndex = slotIndex - queuedSlowIds.length
    setSelectedSlowDuelists(prev => {
      const updated = [...prev]
      const existingIndex = updated.findIndex(id => id === duelistId)
      if (existingIndex !== -1 && existingIndex !== targetIndex) {
        updated.splice(existingIndex, 1)
      }

      if (targetIndex >= updated.length) {
        updated.push(duelistId)
      } else {
        updated[targetIndex] = duelistId
      }

      return updated
    })
  }

  const handleSlowDuelistRemoved = (duelistId: bigint) => {
    setSelectedSlowDuelists(prev => prev.filter(id => id !== duelistId))
  }

  const handlePromoteDuelist = (duelistId: bigint) => {
    if (!isRankedMode) return
    if (queuedFastDuelistId !== undefined) return
    if (selectedFastDuelist) return
    setSelectedSlowDuelists(prev => prev.filter(id => id !== duelistId))
    setSelectedFastDuelist(duelistId)
  }

  const handleFastSelection = (duelistId: bigint) => {
    setSelectedFastDuelist(duelistId)
  }

  const handleFastRemoval = () => {
    setSelectedFastDuelist(null)
  }

  const handleCommitFailure = (duelistId: bigint) => {
    // Remove from committing state but keep in selected (so user can retry)
    setCommittingDuelists(prev => {
      const newSet = new Set(prev)
      newSet.delete(duelistId)
      return newSet
    })
  }

  // Handle scene clicks
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
  useEffect(() => {
    if (!itemClicked) return

    switch (itemClicked) {
      case 'bell':
        handleBellClick()
        break
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (selectedMode && selectedMode !== 'singleplayer') {
      (_currentScene as InteractibleScene).setLayerVariant(TextureName.bg_matchmaking_unranked, selectedMode)
    }
  }, [selectedMode])

  // Sync matchmakingType with selectedMode from settings
  useEffect(() => {
    if (selectedMode === 'ranked') {
      setMatchmakingType(constants.QueueId.Ranked)
    } else if (selectedMode === 'unranked') {
      setMatchmakingType(constants.QueueId.Unranked)
    }
  }, [selectedMode])

  return (
    <>
      {/* Matchmaking Info Popup - Outside 3D transform */}
      {showModeInfo && (
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
      )}

      <div
        className="NoMouse NoDrag NoSelection"
        style={{
          position: "absolute",
          bottom: "18%",
          left: "0%",
          width: "100%",
          height: "94%",
          transform: `perspective(${aspectWidth(
            70
          )}px) rotateX(36deg) rotateY(0deg)`,
          transformStyle: "preserve-3d",
          // backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "67.5%",
            left: "28.4%",
            width: "26%",
            height: "40%",
            justifyItems: "center",
            alignItems: "center",
            backgroundImage: "url(/images/ui/modes/settings_board.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            transform: "rotateX(30deg) translateZ(-200px)",
            filter: "brightness(0) opacity(0.3)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "55%",
            left: "25%",
            width: "30%",
            height: "40%",
            justifyItems: "center",
            alignItems: "center",
            backgroundImage: "url(/images/ui/modes/settings_board.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            transform: "rotateX(-30deg)",
          }}
        >
          {/* Casual/Ranked Switch - Top Row */}
          <div
            className="YesMouse mode-toggle-buttons"
            style={{
              position: "absolute",
              top: aspectWidth(4.8),
              left: "27%",
              transform: "translateX(-50%)",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: aspectWidth(1),
            }}
          >
            <ActionButton
              label="CASUAL"
              toggle
              active={matchmakingType === constants.QueueId.Unranked}
              onClick={() => {
                setIsAnimating(true);
                dispatchSetting("settings.SELECTED_MODE", "unranked");
                setTimeout(() => setIsAnimating(false), 300);
              }}
            />
            <ActionButton
              label="RANKED"
              toggle
              active={matchmakingType === constants.QueueId.Ranked}
              onClick={() => {
                setIsAnimating(true);
                dispatchSetting("settings.SELECTED_MODE", "ranked");
                setTimeout(() => setIsAnimating(false), 300);
              }}
            />
          </div>

          {/* Info Panel - Right Side */}
          <div
            style={{
              position: "absolute",
              top: aspectWidth(2.1),
              right: aspectWidth(1.4),
              width: aspectWidth(12),
              height: aspectWidth(14),
              background: "rgba(0, 0, 0, 0.2)",
              border: "2px solid #ce6f2c",
              borderRadius: aspectWidth(0.5),
              padding: aspectWidth(0.6),
              zIndex: 25,
              transform: "rotateX(-30deg)",
            }}
          >
            <div
              className="YesMouse"
              style={{
                fontSize: aspectWidth(1.6),
                fontWeight: "bold",
                color: "#ce6f2c",
                textAlign: "center",
                marginBottom: aspectWidth(1.2),
                fontFamily: "Garamond",
                textShadow: "0.05rem 0.05rem 1px rgba(0, 0, 0, 0.8)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: aspectWidth(0.4),
              }}
              onMouseEnter={() => setShowModeInfo(true)}
              onMouseLeave={() => setShowModeInfo(false)}
            >
              <span>INFO</span>
              <div
                style={{
                  width: aspectWidth(1.2),
                  height: aspectWidth(1.2),
                  borderRadius: "50%",
                  border: "1px solid #ce6f2c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: aspectWidth(0.8),
                  color: "#ce6f2c",
                  background: "rgba(206, 111, 44, 0.1)",
                }}
              >
                ?
              </div>
            </div>

            <div
              style={{
                fontSize: aspectWidth(1.3),
                color: "#efe1d7",
                lineHeight: 1.3,
                fontFamily: "Garamond",
              }}
            >
              <div style={{ marginBottom: aspectWidth(1) }}>
                <strong style={{ color: "#ce6f2c" }}>Available:</strong>{" "}
                {canMatchMakeIds.filter((id) => notDuelingIds.includes(id)).length} ready
              </div>

              <div style={{ marginBottom: aspectWidth(1) }}>
                <strong style={{ color: "#ce6f2c" }}>In Queue:</strong>{" "}
                {inQueueIds.length}
              </div>

              {matchmakingType === constants.QueueId.Ranked && (
                <div style={{ marginBottom: aspectWidth(1) }}>
                  <strong style={{ color: "#ce6f2c" }}>Can Enlist:</strong>{" "}
                  {rankedCanEnlistIds.length}
                </div>
              )}

              {matchmakingType === constants.QueueId.Ranked && (
                <div style={{ marginBottom: aspectWidth(1) }}>
                  <strong style={{ color: "#ce6f2c" }}>Enlisted:</strong>{" "}
                  {rankedEnlistedIds.length}
                </div>
              )}
            </div>
          </div>
        </div>

        {false && (<div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "0%",
            display: "grid",
            gridTemplateRows: "repeat(1, 1fr)",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: aspectWidth(1),
            padding: aspectWidth(2),
            marginLeft: aspectWidth(12),
            width: "15%",
            height: "40%",
            justifyItems: "center",
            alignItems: "center",
            backgroundImage: "url(/images/ui/modes/queue_frame_fast.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(1.1) drop-shadow(0 0 10px #ce6f2c)",

            opacity: matchmakingType === constants.QueueId.Unranked ? 0 : 1,
            transition: "filter 0.3s ease, opacity 0.3s ease",
          }}
        >
          <DuelistPlaceholderSlot
            ref={fastSlotRef}
            matchmakingType={matchmakingType}
            queueMode={constants.QueueMode.Fast}
            queuedDuelistId={queuedFastDuelistId}
            selectedDuelistId={selectedFastDuelist ?? undefined}
            width={DUELIST_CARD_WIDTH * 1.2}
            height={DUELIST_CARD_HEIGHT * 1.2}
            mouseDisabled={matchmakingType === constants.QueueId.Unranked || isAnimating}
            disabled={matchmakingType === constants.QueueId.Unranked}
            unavailableDuelistIds={unavailableBase}
            showRemoveButton={
              Boolean(
                selectedFastDuelist &&
                queuedFastDuelistId === undefined &&
                !isAnimating
              )
            }
            onDuelistSelected={handleFastSelection}
            onDuelistRemoved={handleFastRemoval}
          />
        </div>)}

        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: true || matchmakingType === constants.QueueId.Unranked ? "0%" : "20%",
            display: "grid",
            gridTemplateRows: "repeat(1, 1fr)",
            gridTemplateColumns:
              true || matchmakingType === constants.QueueId.Unranked
                ? "repeat(6, 1fr)"
                : "repeat(4, 1fr)",
            gap: aspectWidth(1),
            padding: aspectWidth(2),
            marginLeft: aspectWidth(10),
            width:
              true || matchmakingType === constants.QueueId.Unranked ? "80%" : "60%",
            height: "40%",
            justifyItems: "center",
            alignItems: "center",
            backgroundImage: "url(/images/ui/modes/queue_frame_slow.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(1.1) drop-shadow(0 0 10px #ce6f2c)",
            transition:
              "filter 0.3s ease, left 0.3s ease, width 0.3s ease, grid-template-columns 0.3s ease",
          }}
        >
          {slowSlotsData.map(({ slotIndex, queuedId, selectedId, duellingId, duelId }) => {
            const pageIndex = Math.floor(slotIndex / duelistsPerPage)
            const isVisible = pageIndex === currentPage

            const showRemoveButton = Boolean(
              selectedId !== undefined &&
              queuedId === undefined &&
              duellingId === undefined &&
              !isAnimating
            )

            const showPromoteButton = Boolean(
              selectedId !== undefined &&
              isRankedMode &&
              queuedFastDuelistId === undefined &&
              !selectedFastDuelist &&
              !isAnimating
            )

            const showGoToDuelButton = Boolean(
              duelId !== undefined &&
              !isAnimating
            )

            return (
              <div
                key={slotIndex}
                style={{ display: isVisible ? 'flex' : 'none', justifyContent: 'center' }}
              >
                <DuelistPlaceholderSlot
                  ref={instance => {
                    if (instance) {
                      slowSlotRefs.current.set(slotIndex, instance)
                    } else {
                      slowSlotRefs.current.delete(slotIndex)
                    }
                  }}
                  matchmakingType={matchmakingType}
                  queueMode={constants.QueueMode.Slow}
                  queuedDuelistId={queuedId}
                  selectedDuelistId={selectedId}
                  duellingDuelistId={duellingId}
                  duelId={duelId}
                  width={DUELIST_CARD_WIDTH * 1.1}
                  height={DUELIST_CARD_HEIGHT * 1.1}
                  mouseDisabled={isAnimating}
                  showRemoveButton={showRemoveButton}
                  showPromoteButton={showPromoteButton}
                  showGoToDuelButton={showGoToDuelButton}
                  unavailableDuelistIds={unavailableBase}
                  onDuelistSelected={duelistId => handleSlowSlotSelected(slotIndex, duelistId)}
                  onDuelistRemoved={handleSlowDuelistRemoved}
                  onDuelistPromoted={handlePromoteDuelist}
                  onCommitFailure={handleCommitFailure}
                />
              </div>
            )
          })}

          {/* Pagination Controls - Minimal and Flat */}
          <div
            style={{
              position: "absolute",
              bottom: aspectWidth(-2),
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: aspectWidth(0.5),
              zIndex: 10,
            }}
          >
            {/* Previous Page Button */}
            <div
              onClick={currentPage > 0 ? handlePreviousPage : undefined}
              className={`YesMouse ${
                currentPage === 0 ? "Locked" : "Unlocked"
              }`}
              style={{
                width: aspectWidth(1.8),
                height: aspectWidth(1.8),
                borderRadius: aspectWidth(0.2),
                background: currentPage === 0 ? "#444" : "#ce6f2c",
                color: "#efe1d7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: aspectWidth(0.8),
                fontWeight: "bold",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                border: "1px solid #666",
              }}
            >
              ◀
            </div>

            {/* Page Indicator */}
            <span
              style={{
                fontSize: aspectWidth(0.7),
                fontWeight: "bold",
                color: "#ce6f2c",
                fontFamily: "Garamond",
                minWidth: aspectWidth(2),
                textAlign: "center",
              }}
            >
              {currentPage + 1} / {totalPages}
              {totalPages > 10 && " +"}
            </span>

            {/* Next Page Button - Always enabled for infinite pagination */}
            <div
              onClick={handleNextPage}
              className={`YesMouse ${
                currentPage === totalPages - 1 ? "Locked" : "Unlocked"
              }`}
              style={{
                width: aspectWidth(1.8),
                height: aspectWidth(1.8),
                borderRadius: aspectWidth(0.2),
                background: currentPage === totalPages - 1 ? "#444" : "#ce6f2c",
                color: "#efe1d7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: aspectWidth(0.8),
                fontWeight: "bold",
                cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                border: "1px solid #666",
              }}
            >
              ▶
            </div>
          </div>
        </div>
      </div>

      <ExclamationIndicator
        src="/images/ui/notification_exclamation.png"
        visible={((selectedFastDuelist ?? 0n) > 0n || selectedSlowDuelists.length > 0) && !isAnyCommitting}
        position={{ top: "3%", left: "54%" }}
        size={{ width: 8 }}
        rotation={-15}
        animations={{
          opacity: true,
          pulse: true,
          float: true,
          hoverScale: true,
        }}
        animationTiming={{
          opacityDuration: 200,
          pulseDuration: 800,
          floatDuration: 800,
          pulseIntensity: 8,
          floatAmount: 6,
          hoverScaleFactor: 1.2,
        }}
        onMouseEnter={() => {
          emitter.emit(
            "hover_description",
            "Click the bell to commit your duelists to the queue"
          );
        }}
        onMouseLeave={() => {
          emitter.emit("hover_description", "");
        }}
      />
    </>
  );
}
