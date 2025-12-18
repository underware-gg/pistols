import { useEffect, useMemo, useRef } from "react";
import { emitter } from "/src/three/game";
import { useQuizParty, useActiveQuizQuestionsByParty, useQuizQuestion, useQuizPartyLeaderboards } from "/src/stores/quizStore";

interface QuizQuestionItemProps {
  partyId: number;
  questionId: number;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (questionId: number) => void;
}

const QuizQuestionItem: React.FC<QuizQuestionItemProps> = ({
  partyId,
  questionId,
  isSelected,
  isActive,
  onSelect,
}) => {
  const itemRef = useRef<HTMLButtonElement>(null);
  const { isOpen, isClosed } = useQuizQuestion(partyId, questionId);

  // Auto-scroll to this item when it becomes active
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isActive]);

  const handleClick = () => {
    onSelect(questionId);
  };

  return (
    <button
      ref={itemRef}
      className={`quiz-question-item ${
        isSelected ? "quiz-question-item-selected" : ""
      }`}
      onClick={handleClick}
      data-question-id={questionId}
      aria-label={`View question ${questionId}`}
    >
      <span className="quiz-question-number">Q{questionId}</span>

      {/* Active question - always show status */}
      {isActive && isOpen && (
        <span className="quiz-question-badge quiz-question-badge-active">
          LIVE
        </span>
      )}
      {isActive && isClosed && (
        <span className="quiz-question-badge quiz-question-badge-closed">
          CLOSED
        </span>
      )}

      {/* Non-active questions - show closed if they're closed */}
      {!isActive && isClosed && (
        <span className="quiz-question-badge quiz-question-badge-inactive">
          CLOSED
        </span>
      )}
    </button>
  );
};

interface FinalResultsCardProps {
  isSelected: boolean;
  isPartyClosed: boolean;
  hasLeaderboardData: boolean;
  onSelect: () => void;
}

const FinalResultsCard: React.FC<FinalResultsCardProps> = ({
  isSelected,
  isPartyClosed,
  hasLeaderboardData,
  onSelect,
}) => {
  const handleClick = () => {
    if (hasLeaderboardData) {
      onSelect();
    }
  };

  return (
    <button
      className={`quiz-leaderboard-button ${
        isPartyClosed ? "quiz-leaderboard-button-final" : "quiz-leaderboard-button-leaderboard"
      } ${
        isSelected ? "quiz-leaderboard-button-selected" : ""
      } ${
        !hasLeaderboardData ? "quiz-leaderboard-button-disabled" : ""
      }`}
      onClick={handleClick}
      disabled={!hasLeaderboardData}
      data-question-id="final"
      aria-label={isPartyClosed ? "View final results" : "View leaderboard"}
    >
      <span className="quiz-leaderboard-button-text">
        {isPartyClosed ? "Final Score" : "Leaderboard"}
      </span>
    </button>
  );
};

interface QuizQuestionSelectorProps {
  partyId: number;
  questionId: number;
  onQuestionSelect: (questionId: number | null) => void;
  questionListRef: React.RefObject<HTMLDivElement>;
  isLeaderboardOpen: boolean;
  isInfoPanelOpen: boolean;
  onInfoPanelToggle: () => void;
}

export const QuizQuestionSelector = ({
  partyId,
  questionId,
  onQuestionSelect,
  questionListRef,
  isLeaderboardOpen,
  isInfoPanelOpen,
  onInfoPanelToggle,
}: QuizQuestionSelectorProps) => {
  const { partyName, description: partyDescription, isPartyClosed } = useQuizParty(partyId);
  const { activeQuestionIds } = useActiveQuizQuestionsByParty(partyId);
  const { leaderboards } = useQuizPartyLeaderboards(partyId);

  // Compute activeQuestionId from activeQuestionIds
  const activeQuestionId = useMemo(() => {
    if (!partyId) return 0;
    return activeQuestionIds[activeQuestionIds.length - 1] ?? 0;
  }, [partyId, activeQuestionIds]);

  // Compute quizStatus
  const quizStatus = useMemo(() => {
    if (!partyId) return 'unknown';
    if (isPartyClosed) return 'ended';
    if (activeQuestionIds.length > 0) return 'ongoing';
    return 'not-started';
  }, [partyId, isPartyClosed, activeQuestionIds.length]);

  //TODO: Auto-scroll to active question when leaderboard is closed
  useEffect(() => {
    if (activeQuestionId > 0 && questionListRef.current && !isLeaderboardOpen) {
      // Find the active question button
      const activeButton = questionListRef.current.querySelector(
        `[data-question-id="${activeQuestionId}"]`
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }, [activeQuestionId, isLeaderboardOpen, questionListRef]);

  if (partyId === 0) return null;

  return (
    <div
      className={`quiz-selector ${
        isInfoPanelOpen ? "quiz-selector-expanded" : ""
      }`}
    >
      <div className="quiz-selector-main">
        <div className="quiz-selector-header">
          <div className="quiz-selector-name">
            {partyName || "Quiz"}
          </div>
          <div className="quiz-selector-status-row">
            <div className={`quiz-selector-status quiz-selector-status-${quizStatus}`}>
              {quizStatus === "not-started" && "Waiting"}
              {quizStatus === "ongoing" && "Live"}
              {quizStatus === "ended" && "Finished"}
            </div>
            <button
              className="quiz-selector-info-button"
              onClick={onInfoPanelToggle}
              onMouseEnter={() =>
                emitter.emit(
                  "hover_description",
                  isInfoPanelOpen
                    ? "Click to hide quiz details"
                    : "Click to see quiz details"
                )
              }
              onMouseLeave={() => emitter.emit("hover_description", null)}
              aria-label={isInfoPanelOpen ? "Hide info" : "Show info"}
            >
              {isInfoPanelOpen ? "CLOSE" : "INFO"}
            </button>
          </div>
        </div>

        {(activeQuestionIds.length > 0 || isPartyClosed) && (
          <div className="quiz-selector-questions" ref={questionListRef}>
            {activeQuestionIds.map((qId) => (
              <QuizQuestionItem
                key={qId}
                partyId={partyId}
                questionId={qId}
                isSelected={qId === questionId && questionId !== 0}
                isActive={qId === activeQuestionId && !isPartyClosed}
                onSelect={onQuestionSelect}
              />
            ))}
          </div>
        )}
        
        {/* Leaderboard/Final Score button - always visible when there are questions or party is closed */}
        {(activeQuestionIds.length > 0 || isPartyClosed) && (
          <FinalResultsCard
            isSelected={questionId === 0}
            isPartyClosed={isPartyClosed}
            hasLeaderboardData={leaderboards.length > 0}
            onSelect={() => onQuestionSelect(0)}
          />
        )}
      </div>

      {/* Info section - appears to the right */}
      <div
        className={`quiz-selector-info-section ${
          isInfoPanelOpen ? "quiz-selector-info-section-visible" : ""
        }`}
      >
        <div className="quiz-selector-info-content">
          {partyDescription || "No description available."}
        </div>
      </div>
    </div>
  );
};

