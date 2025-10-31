import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SettingsActions, useSettings } from '/src/hooks/SettingsContext'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { _currentScene, playAudio } from '/src/three/game'
import { TextureName } from '/src/data/assets'
import { ActionButton } from '/src/components/ui/Buttons'
import { DuelistMatchmakingSlot, DuelistMatchmakingSlotHandle } from '/src/components/ui/DuelistMatchmakingSlot'
import { MatchmakingInfoModal } from '/src/components/modals/MatchmakingInfoModal'
import { useDuelistsInMatchMaking } from '/src/stores/matchStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useQueryChallengeIdsForMatchmaking } from '/src/stores/challengeQueryStore'
import { DuelistEmptySlot, DuelistEmptySlotHandle } from '../ui/DuelistEmptySlot'
import { AudioName } from '/src/data/audioAssets'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'

export default function ScMatchmaking() {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { selectedMode, dispatchSetting } = useSettings()
  const { requeueDuelist, dispatchRequeueDuelist } = usePistolsContext()
  
  const [matchmakingType, setMatchmakingType] = useState<constants.QueueId>(constants.QueueId.Unranked);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Pagination state for slow duelists
  const [currentPage, setCurrentPage] = useState(0)
  // const duelistsPerPage = matchmakingType === constants.QueueId.Unranked ? 6 : 4
  const duelistsPerPage = 6;
  
  const fastSlotRef = useRef<DuelistMatchmakingSlotHandle | null>(null)
  const slowSlotRefs = useRef<Map<number, DuelistMatchmakingSlotHandle>>(new Map())
  const emptySlowSlotRankedRef = useRef<DuelistEmptySlotHandle | null>(null)
  const emptySlowSlotUnrankedRef = useRef<DuelistEmptySlotHandle | null>(null)
  
  // Track individual duelist commit states
  const [duelistInAction, setDuelistInAction] = useState<{ duelistId: bigint; status: boolean | null; error: string | null; action: 'commit' | 'enlist' } | null>(null)
  
  const [hasAutoSelected, setHasAutoSelected] = useState(false)

  const { challengeIds } = useQueryChallengeIdsForMatchmaking(matchmakingType === constants.QueueId.Ranked ? constants.DuelType.Ranked : constants.DuelType.Unranked);

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
  
  const isRankedMode = useMemo(() => matchmakingType === constants.QueueId.Ranked, [matchmakingType])

  const totalUsedSlowSlots = useMemo(() => {
    // Count all the slots that will actually be created in slowSlotsData
    const duellingDuelIds = Object.values(duelsByDuelistId).map(BigInt)
    const challengeSlotsCount = challengeIds.filter(id => !duellingDuelIds.includes(id)).length
    const duellingSlotCount = duellingIds.filter(id => !inQueueIds.includes(id)).length
    
    return challengeSlotsCount + duellingSlotCount + inQueueIds.length
  }, [challengeIds, duelsByDuelistId, duellingIds, inQueueIds])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((totalUsedSlowSlots + 1) / duelistsPerPage)), [totalUsedSlowSlots, duelistsPerPage])

  const slowSlotsData = useMemo(() => {
    const slots: Array<{ slotIndex: number; duelistId?: bigint; duelId?: bigint }> = []
    let currentSlotIndex = 0
    
    //TODO handle fast queue later!
    // First, add duelling duelists (immediate matches) - they get priority at the front
    const duellingDuelIds = Object.values(duelsByDuelistId).map(BigInt)
    challengeIds.filter(id => !duellingDuelIds.includes(id)).forEach((duelId) => {
      slots.push({ slotIndex: currentSlotIndex++, duelId: duelId })
    })

    // Sort duelling duelists by their duelId to maintain consistent order
    const sortedDuellingIds = duellingIds.sort((a, b) => {
      const duelIdA = duelsByDuelistId[a.toString()];
      const duelIdB = duelsByDuelistId[b.toString()];
      if (!duelIdA && !duelIdB) return 0;
      if (!duelIdA) return 1;
      if (!duelIdB) return -1;
      return BigInt(duelIdA) < BigInt(duelIdB)
        ? -1
        : BigInt(duelIdA) > BigInt(duelIdB)
        ? 1
        : 0;
    });
    sortedDuellingIds.forEach((duelistId) => {
      const duelId = duelsByDuelistId[duelistId.toString()];
      slots.push({
        slotIndex: currentSlotIndex++,
        duelistId: duelistId,
        duelId: duelId ? BigInt(duelId) : undefined,
      });
    });
    
    // Then add queued duelists
    inQueueIds.filter(id => !sortedDuellingIds.includes(id)).forEach((duelistId) => {
      slots.push({ 
        slotIndex: currentSlotIndex++, 
        duelistId: duelistId, 
        duelId: duelsByDuelistId[duelistId.toString()] ? BigInt(duelsByDuelistId[duelistId.toString()]) : undefined 
      })
    })
    
    // console.log(`slowSlotsData() =>`, challengeIds.filter(id => !duellingDuelIds.includes(id)), sortedDuellingIds, inQueueIds, slots);

    return slots
  }, [totalUsedSlowSlots, inQueueIds, duellingIds, duelsByDuelistId, challengeIds])

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  const handleBellClick = useCallback(() => {    
    if (duelistInAction && duelistInAction.status === null) {
      playAudio(AudioName.BELL_CLICK_BROKEN)
      return
    }
    
    // Find the empty slot to open SelectDuelistModal for
    const emptySlot = isRankedMode ? emptySlowSlotRankedRef.current : emptySlowSlotUnrankedRef.current
    
    if (!emptySlot) {
      playAudio(AudioName.BELL_CLICK_BROKEN)
      return
    }
    
    playAudio(AudioName.BELL_CLICK)
    emptySlot.openDuelistSelect()
  }, [duelistInAction, isRankedMode])

  const handleDuelistRemoved = useCallback((duelistId: bigint) => {
    setDuelistInAction(null)
  }, [])

  const handleRequeueDuelist = useCallback((duelistId: bigint) => {
    const emptySlot = isRankedMode ? emptySlowSlotRankedRef.current : emptySlowSlotUnrankedRef.current
    
    if (!emptySlot) {
      return
    }
    
    emptySlot.commitToQueue(duelistId)
  }, [isRankedMode])

  const handlePromoteDuelist = useCallback((duelistId: bigint) => {
    //TODO
  }, [])

  const handleActionStart = useCallback((duelistId: bigint, action: 'commit' | 'enlist') => {
    setDuelistInAction({ duelistId, status: null, error: null, action })
  }, [])

  const handleActionComplete = useCallback((status: boolean, duelistId: bigint, error: string | null) => {
    setDuelistInAction({ duelistId, status, error, action: duelistInAction?.action })
  }, [])

  // Handle scene clicks
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
  useEffect(() => {
    if (!itemClicked) return

    switch (itemClicked) {
      case 'bell':
        handleBellClick()
        break
    }
  }, [itemClicked, handleBellClick])

  useEffect(() => {
    if (selectedMode && selectedMode !== 'singleplayer') {
      (_currentScene as InteractibleScene).setLayerVariant(TextureName.bg_matchmaking_unranked, selectedMode)
    }
    setCurrentPage(0)
  }, [selectedMode])

  // Sync matchmakingType with selectedMode from settings
  useEffect(() => {
    if (selectedMode === 'ranked') {
      setMatchmakingType(constants.QueueId.Ranked)
    } else if (selectedMode === 'unranked') {
      setMatchmakingType(constants.QueueId.Unranked)
    }
  }, [selectedMode])

  useEffect(() => {
    if (isPositiveBigint(requeueDuelist.duelistId) && !hasAutoSelected) {
      const emptySlot = isRankedMode ? emptySlowSlotRankedRef.current : emptySlowSlotUnrankedRef.current
      
      if (emptySlot) {
        emptySlot.commitToQueue(BigInt(requeueDuelist.duelistId))
        setHasAutoSelected(true)
        
        dispatchRequeueDuelist(0n, requeueDuelist.matchType)
      }
    }
  }, [requeueDuelist, hasAutoSelected, isRankedMode, dispatchRequeueDuelist])

  // Memoize empty slot to preserve state between mode changes
  const emptySlotRanked = useMemo(() => (
    <DuelistEmptySlot
      ref={emptySlowSlotRankedRef}
      matchmakingType={matchmakingType}
      queueMode={constants.QueueMode.Slow}
      width={DUELIST_CARD_WIDTH * 1.1}
      height={DUELIST_CARD_HEIGHT * 1.1}
      mouseDisabled={isAnimating || (duelistInAction && duelistInAction.status === null)}
      onDuelistRemoved={handleDuelistRemoved}
      onActionStart={handleActionStart}
      onActionComplete={handleActionComplete}
    />
  ), [matchmakingType, isAnimating, duelistInAction, handleActionStart, handleActionComplete, handleDuelistRemoved])

  const emptySlotUnranked = useMemo(() => (
    <DuelistEmptySlot
      ref={emptySlowSlotUnrankedRef}
      matchmakingType={matchmakingType}
      queueMode={constants.QueueMode.Slow}
      width={DUELIST_CARD_WIDTH * 1.1}
      height={DUELIST_CARD_HEIGHT * 1.1}
      mouseDisabled={isAnimating || (duelistInAction && duelistInAction.status === null)}
      onDuelistRemoved={handleDuelistRemoved}
      onActionStart={handleActionStart}
      onActionComplete={handleActionComplete}
    />
  ), [matchmakingType, isAnimating, duelistInAction, handleActionStart, handleActionComplete, handleDuelistRemoved])

  const slowSlots = useMemo(() => {
    return slowSlotsData.slice(currentPage * duelistsPerPage, (currentPage + 1) * duelistsPerPage).map(({ slotIndex, duelistId, duelId }) => {
            return (
              <div
                key={slotIndex}
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <DuelistMatchmakingSlot
                  ref={instance => {
                    if (instance) {
                      slowSlotRefs.current.set(slotIndex, instance)
                    } else {
                      slowSlotRefs.current.delete(slotIndex)
                    }
                  }}
                  matchmakingType={matchmakingType}
                  queueMode={constants.QueueMode.Slow}
                  duelistId={duelistId}
                  duelId={duelId}
                  width={DUELIST_CARD_WIDTH * 1.1}
                  height={DUELIST_CARD_HEIGHT * 1.1}
                  mouseDisabled={isAnimating || (duelistInAction && duelistInAction.status === null)}
                  onDuelistPromoted={handlePromoteDuelist}
                  onRequeueDuelist={handleRequeueDuelist}
                />
              </div>
            )
          })
  }, [currentPage, duelistsPerPage, matchmakingType, isAnimating, duelistInAction, handlePromoteDuelist, handleRequeueDuelist, slowSlotsData])
  return (
    <>
      {/* Matchmaking Info Modal */}
      <MatchmakingInfoModal 
        visible={showModeInfo} 
        matchmakingType={matchmakingType} 
      />

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
            bottom: aspectHeight(67.5),
            left: aspectWidth(28.4),
            width: aspectWidth(26),
            height: aspectHeight(40),
            justifyItems: "center",
            alignItems: "center",
            backgroundImage: "url(/images/ui/modes/settings_board.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            transform: `rotateX(30deg) translateZ(-${aspectWidth(15)}px)`,
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
                dispatchSetting(SettingsActions.SELECTED_MODE, "unranked");
                setTimeout(() => setIsAnimating(false), 300);
              }}
            />
            <ActionButton
              label="RANKED"
              toggle
              active={matchmakingType === constants.QueueId.Ranked}
              onClick={() => {
                setIsAnimating(true);
                dispatchSetting(SettingsActions.SELECTED_MODE, "ranked");
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
                {canMatchMakeIds.length} ready
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

        {false && (
          <div
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
            {/* <DuelistMatchmakingSlot
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
            /> */}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: aspectWidth(4),
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
          {slowSlots}

          <div
            style={{ 
              display: currentPage == totalPages - 1 ? 'flex' : 'none', 
              justifyContent: 'center' 
            }}
          >
            {isRankedMode ? emptySlotRanked : emptySlotUnranked}
          </div>

          {/* Pagination Controls - Minimal and Flat */}
          <div
            style={{
              position: "absolute",
              bottom: aspectWidth(-3.4),
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

      {/* <ExclamationIndicator
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
            "Click the bell to select a duelist for the queue"
          );
        }}
        onMouseLeave={() => {
          emitter.emit("hover_description", "");
        }}
      /> */}
    </>
  );
}
