import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router";
import { useAccount } from "@starknet-react/core";
import { useDojoSystemCalls } from "@underware/pistols-sdk/dojo";
import { useTransactionHandler } from "/src/hooks/useTransaction";
import { useGameAspect } from "/src/hooks/useGameAspect";
import { useGameEvent } from "/src/hooks/useGameEvent";
import {
  useFetchAllQuiz,
  useQuizPartyByName,
  useQuizPlayerAnswer,
  useQuizQuestion,
  useQuizQuestionWinners,
  useQuizPartyLeaderboards,
  useActiveQuizQuestionsByParty,
} from "/src/stores/quizStore";
import { ActionButton } from "/src/components/ui/Buttons";
import { LoadingIcon } from "/src/components/ui/Icons";
import { usePistolsContext } from "/src/hooks/PistolsContext";
import { QuizQuestionSelector } from "../ui/quiz/QuizQuestionSelector";
import { QuizLeaderboard } from "../ui/quiz/QuizLeaderboard";
import { QuizAnswerGrid } from "../ui/quiz/QuizAnswerGrid";
import { _currentScene, emitter } from "/src/three/game";
import { InteractibleScene } from "/src/three/InteractibleScene";
import { formatTimestampDeltaCountdown } from "@underware/pistols-sdk/utils";
import { useClientTimestamp } from "@underware/pistols-sdk/utils/hooks";
import { useThreeJsContext } from "/src/hooks/ThreeJsContext";
import { AudioName, AUDIO_ASSETS } from "/src/data/audioAssets";

export default function ScQuizRoom() {
  const { aspectWidth } = useGameAspect();
  const { account, address, isConnected } = useAccount();
  const { community } = useDojoSystemCalls();
  const { connectOpener } = usePistolsContext();
  const { quiz_name: quizName } = useParams<{ quiz_name: string }>();
  const { value: hoveredItem } = useGameEvent("hover_item", null);
  const { gameImpl } = useThreeJsContext();
  
  useFetchAllQuiz();

  const musicStateRef = useRef<{ menus: boolean; ingame: boolean } | null>(null);
  
  useEffect(() => {
    if (gameImpl) {
      const menusWasPlaying = AUDIO_ASSETS[AudioName.MUSIC_MENUS]?.object?.isPlaying ?? false;
      const ingameWasPlaying = AUDIO_ASSETS[AudioName.MUSIC_INGAME]?.object?.isPlaying ?? false;
      
      musicStateRef.current = { menus: menusWasPlaying, ingame: ingameWasPlaying };
      
      gameImpl.pauseAudio(AudioName.MUSIC_MENUS);
      gameImpl.pauseAudio(AudioName.MUSIC_INGAME);
    }
    
    return () => {
      if (gameImpl && musicStateRef.current) {
        const { menus, ingame } = musicStateRef.current;
        if (menus) {
          gameImpl.playAudio(AudioName.MUSIC_MENUS, true);
        }
        if (ingame) {
          gameImpl.playAudio(AudioName.MUSIC_INGAME, true);
        }
      }
    };
  }, [gameImpl]);

  const { 
    partyId, 
    partyName,
    description: partyDescription, 
    timestamp_start: partyTimestampStart,
    isPartyClosed,
  } = useQuizPartyByName(quizName);
  const { activeQuestionIds } = useActiveQuizQuestionsByParty(partyId);
  
  const questionListRef = useRef<HTMLDivElement>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  const activeQuestionId = useMemo(() => {
    if (!partyId) return 0;
    return activeQuestionIds[activeQuestionIds.length - 1] ?? 0;
  }, [partyId, activeQuestionIds]);

  const questionId = selectedQuestionId ?? activeQuestionId;

  const { question, description, options, isOpen, isClosed } = useQuizQuestion(partyId, questionId);
  const { playerAnswerNumber } = useQuizPlayerAnswer(partyId, questionId, address);
  const { winners } = useQuizQuestionWinners(partyId, questionId);
  const { leaderboards } = useQuizPartyLeaderboards(partyId);
  
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [showWinnerForQuestion, setShowWinnerForQuestion] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const leaderboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  
  const [countdownFinished, setCountdownFinished] = useState(false);
  const { clientTimestamp } = useClientTimestamp({ autoUpdate: !countdownFinished, updateSeconds: 1 });

  useEffect(() => {
    if (partyTimestampStart > 0 && clientTimestamp > 0) {
      if (partyTimestampStart - clientTimestamp <= 0) {
        setCountdownFinished(true);
      } else {
        setCountdownFinished(false);
      }
    } else {
      setCountdownFinished(false);
    }
  }, [partyTimestampStart, clientTimestamp]);

  useEffect(() => {
    if (isPartyClosed && selectedQuestionId === null) {
      setSelectedQuestionId(0);
    }
  }, [isPartyClosed, selectedQuestionId]);

  const hasTriggeredConfetti = useRef(false);
  useEffect(() => {
    if (isPartyClosed && questionId === 0 && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        const timer = setTimeout(() => {
          const duration = 1000;
          const end = Date.now() + duration;

          const colors = ['#ef9758', '#006400', '#dc143c', '#1a1a1a'];

          (function frame() {
            const topPositions = [0.2, 0.4, 0.6, 0.8];
            
            topPositions.forEach((x) => {
              confetti({
                particleCount: 6,
                angle: -90,
                spread: 90,
                startVelocity: 50,
                origin: { x, y: -0.5 },
                colors: colors,
                gravity: 1,
              });
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        }, 500);

        return () => clearTimeout(timer);
      }).catch(() => {
      });
    }
    
    if (questionId !== 0) {
      hasTriggeredConfetti.current = false;
    }
  }, [isPartyClosed, questionId]);

  const isQuizNotStarted = useMemo(() => {
    if (partyId && !isPartyClosed && activeQuestionIds.length === 0) return true;
    return false;
  }, [partyId, isPartyClosed, activeQuestionIds.length]);

  const onCompleteAnswer = useCallback((result: boolean | Error) => {
    if (result instanceof Error || result === false) {
      setErrorMessage("Failed to submit answer. Please try again.");
      setSuccessMessage(null);
      return;
    }
    setErrorMessage(null);
    setSuccessMessage("Answer submitted! Waiting for the host to close the question.");
  }, []);

  const {
    call: submitAnswer,
    isLoading: isSubmitting,
    isWaitingForIndexer,
  } = useTransactionHandler<boolean, [number, number, number]>({
    key: `quiz_answer_${partyId}_${questionId}`,
    transactionCall: (partyIdArg, questionIdArg, answerNumberArg, key) =>
      community.answer_quiz_question(account, partyIdArg, questionIdArg, answerNumberArg, key),
    onComplete: onCompleteAnswer,
  });

  const hasAnswered = selectedAnswer > 0;
  const selectionLocked = hasAnswered || isSubmitting || isWaitingForIndexer || isClosed || !isOpen;

  const hasWinner = isClosed && winners && winners.length > 0;
  const isViewingActiveQuestion = questionId === activeQuestionId;
  const isViewingClosedNonActiveQuestion = (isClosed && questionId !== activeQuestionId) || isPartyClosed;
  const shouldShowWinner = (isViewingActiveQuestion && isClosed && !isPartyClosed) || (isViewingClosedNonActiveQuestion && showWinnerForQuestion);


  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (playerAnswerNumber > 0) {
      setSelectedAnswer(playerAnswerNumber);
    } else {
      setSelectedAnswer(null);
    }

    if (playerAnswerNumber > 0 && isViewingActiveQuestion && !isClosed) {
      setSuccessMessage("Answer submitted! Waiting for the host to close the question.");
    }

    setShowWinnerForQuestion(false);
  }, [questionId, playerAnswerNumber, isViewingActiveQuestion, isClosed, setShowWinnerForQuestion]);


  //----------------
  // Scene handling
  //----------------
  useEffect(() => {
    (_currentScene as InteractibleScene)?.setShowHoverDescription(false);
    (_currentScene as InteractibleScene)?.setClickable(!isQuizNotStarted && !shouldShowWinner && !isInfoPanelOpen && !(isPartyClosed && questionId === 0));

    return () => {
      (_currentScene as InteractibleScene)?.setShowHoverDescription(true);
      (_currentScene as InteractibleScene)?.setClickable(true);
    }
  }, [_currentScene, isQuizNotStarted, shouldShowWinner, isInfoPanelOpen, isPartyClosed, questionId]);

  useEffect(() => {
    if (hoveredItem === "cumberlord") {
      emitter.emit("hover_description", description || "Quiz hint");
    }
  }, [hoveredItem, description]);

  
  //------------------
  // Leaderboard handling
  //------------------
  useEffect(() => {
    if (hasWinner && isViewingActiveQuestion && leaderboards.length > 0) {
      toggleLeaderboard(true);
    }
  }, [hasWinner, isViewingActiveQuestion, leaderboards.length]);
  
  const toggleLeaderboard = useCallback((show: boolean) => {
    if (leaderboardTimerRef.current) {
      clearTimeout(leaderboardTimerRef.current);
    }

    setIsLeaderboardOpen(show);

    if (show) {
      leaderboardTimerRef.current = setTimeout(() => {
        setIsLeaderboardOpen(false);
      }, 5000);
    }
  }, [setIsLeaderboardOpen]);

  //------------------
  //Board handling
  //------------------
  const handleAnswerClick = useCallback(
    (choice: number) => {
      if (selectionLocked || !account) return;
      setSelectedAnswer(choice);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (partyId && questionId) {
        submitAnswer(partyId, questionId, choice);
      } else {
        setSelectedAnswer(null);
      }
    },
    [selectionLocked, account, partyId, questionId, submitAnswer, setErrorMessage]
  );
  
  const boardTitle = useMemo(() => {
    if (!quizName) return "No Quiz Selected";
    if (!partyId) return `Quiz "${quizName}" not found`;
    
    // PRIORITY 1: If quiz ended but viewing a question, show ultimate winner
    if (isPartyClosed && questionId == 0 && leaderboards.length > 0) {
      return `${leaderboards[0].name}`;
    }
    
    // PRIORITY 2: If there's a question, show question-related content
    if (questionId && questionId !== 0 && (question || options.length > 0)) {
      if (shouldShowWinner) {
        return hasWinner ? `${winners[0].name}` : "-";
      }
      
      if (!isOpen && !isClosed) return "Question not yet opened";
      if (isOpen) return question || "Question incoming...";
      return question || "Question closed";
    }
    
    // PRIORITY 3: No questions yet - check quiz party status
    if (isQuizNotStarted) {
      if (partyTimestampStart > 0) {
        const timeRemaining = partyTimestampStart - clientTimestamp;
        
        if (timeRemaining <= 0) {
          return "Quiz is about to start!\nGet ready!";
        }
        
        const timer = formatTimestampDeltaCountdown(clientTimestamp, partyTimestampStart);
        return `Quiz Starting in around:\n${timer.days > 0 ? `${timer.days}d ` : ''}${timer.hours > 0 ? `${timer.hours}h ` : ''}${timer.minutes > 0 ? `${timer.minutes}m ` : ''}${timer.seconds > 0 ? `${timer.seconds}s` : ''}`;
      }
      return "Quiz Not Started Yet";
    }
    
    return "Waiting for next question...";
  }, [
    quizName, 
    partyId, 
    questionId, 
    isOpen, 
    isClosed, 
    question, 
    options.length, 
    isQuizNotStarted, 
    isPartyClosed,
    partyTimestampStart, 
    hasWinner, 
    winners, 
    leaderboards, 
    shouldShowWinner, 
    clientTimestamp,
  ]);

  const titleFontSize = useMemo(() => {
    const length = boardTitle ? boardTitle.length : 0;
    if (length < 60) return aspectWidth(2.2);
    if (length < 120) return aspectWidth(2.0);
    if (length < 180) return aspectWidth(1.8);
    if (length < 240) return aspectWidth(1.6);
    if (length < 300) return aspectWidth(1.4);
    return aspectWidth(1.2);
  }, [boardTitle, aspectWidth]);


  const boardSubtitle = useMemo(() => {
    if (!quizName) {
      return "Please navigate to a quiz using its name in the URL.";
    }
    if (!partyId) {
      return `Cannot find a quiz party named "${quizName}". Check the name and try again.`;
    }
    
    // Quiz ended message
    if (isPartyClosed && questionId === 0) {
      return partyDescription || "The quiz has concluded! Check out the final standings.";
    }
    
    if (isQuizNotStarted) {
      return partyDescription || "Stay tuned! The quiz will begin soon.";
    }
    
    if (!questionId || questionId === 0 || (!question && !options.length)) {
      return "The quiz host hasn't published any questions yet. Stay tuned!";
    }
    
    // When showing winner, display question description at bottom
    if (shouldShowWinner) {
      return description || "";
    }

    return "";
  }, [
    quizName,
    partyId,
    questionId,
    question,
    options.length,
    description,
    isPartyClosed,
    isQuizNotStarted,
    shouldShowWinner,
  ]);

  return (
    <>
      <QuizQuestionSelector
        partyId={partyId}
        questionId={questionId}
        onQuestionSelect={setSelectedQuestionId}
        questionListRef={questionListRef}
        isLeaderboardOpen={isLeaderboardOpen}
        isInfoPanelOpen={isInfoPanelOpen}
        onInfoPanelToggle={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
      />

      {/* Main board */}
      <div className={`quiz-board ${isPartyClosed && questionId === 0 ? 'quiz-board-champion' : ''}`}>
        <div className="quiz-board-backdrop" />
        <div className="quiz-board-body">
          {isViewingClosedNonActiveQuestion && questionId !== 0 && (
            <ActionButton
              label={shouldShowWinner ? "Show Question" : "Show Winner"}
              onClick={() => setShowWinnerForQuestion(!showWinnerForQuestion)}
              important
              large
              className="quiz-view-toggle"
            />
          )}

          {((shouldShowWinner && questionId !== 0) || (isPartyClosed && questionId === 0)) && (
            <div className="quiz-winner-title">
              {questionId === 0 ? "Quiz Champion:" : `Question ${questionId} Winner:`}
            </div>
          )}

          {isPartyClosed && questionId === 0 && leaderboards.length > 0 ? (
            <div className="quiz-champion-display">
              <div className="quiz-champion-row">
                <div className="quiz-champion-ribbon-container">
                  <div
                    className="quiz-champion-ribbon"
                    style={{ backgroundImage: 'url("/images/ui/card_rank_1.png")' }}
                  />
                  <span className="quiz-champion-rank">#1</span>
                </div>
                <div className="quiz-champion-name" style={{ fontSize: titleFontSize }}>
                  {leaderboards[0].name}
                </div>
              </div>
              <div className="quiz-champion-score">{leaderboards[0].score} pts</div>
            </div>
          ) : (
            <div className="quiz-title" style={{ fontSize: titleFontSize }}>
              {boardTitle}
            </div>
          )}
          {boardSubtitle && (
            <div className="quiz-description">{boardSubtitle}</div>
          )}

          {isViewingActiveQuestion && isClosed && !isPartyClosed && (
            <div className="quiz-question-spinner">
              <LoadingIcon size="small" className="quiz-question-spinner-icon" />
              <div className="quiz-question-spinner-text">
                Waiting for the host to open next question...
              </div>
            </div>
          )}

        </div>
      </div>

      <QuizLeaderboard
        partyId={partyId}
        isPartyClosed={isPartyClosed}
        isLeaderboardOpen={isLeaderboardOpen}
        onToggleLeaderboard={() => toggleLeaderboard(!isLeaderboardOpen)}
      />

      {questionId !== 0 ? (
        <QuizAnswerGrid
          partyId={partyId}
          questionId={questionId}
          selectedAnswer={selectedAnswer}
          isSubmitting={isSubmitting}
          isWaitingForIndexer={isWaitingForIndexer}
          onAnswerClick={handleAnswerClick}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      ) : (
        // Runners-up podium (positions 2-5)
        isPartyClosed && (
          <div className="quiz-runners-up">
            <div className="quiz-runners-up-gradient" />
            <div className="quiz-runners-up-grid">
              {[2, 3, 4, 5, 6, 7, 8, 9].map((rank) => {
                const player = leaderboards[rank - 1];
                const ribbonImage =
                  rank <= 3
                    ? `/images/ui/card_rank_${rank}.png`
                    : `/images/ui/card_rank.png`;
                
                return (
                  <div key={rank} className="quiz-runners-up-item">
                    <div className="quiz-runners-up-top-row">
                      <div className="quiz-runners-up-rank-container">
                        <div
                          className="quiz-runners-up-ribbon"
                          style={{ backgroundImage: `url("${ribbonImage}")` }}
                        />
                        <span className="quiz-runners-up-rank">#{rank}</span>
                      </div>
                      <div className="quiz-runners-up-name" title={player?.name || ''}>
                        <span className="quiz-runners-up-name-text">
                          {player?.name || `No player finished ${rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}`}
                        </span>
                      </div>
                    </div>
                    {player && (
                      <span className="quiz-runners-up-score">{player.score}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Loading overlay when submitting */}
      {(isSubmitting || isWaitingForIndexer) && (
        <div className="quiz-loading-overlay">
          <div className="quiz-loading-spinner">
            <LoadingIcon />
            <div className="quiz-loading-text">
              {isSubmitting || isWaitingForIndexer
                ? "Submitting answer..."
                : "Waiting for confirmation..."}
            </div>
          </div>
        </div>
      )}

      {/* Connection prompt */}
      {!isConnected && isOpen && options.length > 0 && (
        <div className="quiz-connect-prompt">
          <ActionButton
            label="Connect wallet to answer"
            important
            onClick={() => connectOpener?.open()}
            disabled={false}
            large
          />
        </div>
      )}

    </>
  );
}
