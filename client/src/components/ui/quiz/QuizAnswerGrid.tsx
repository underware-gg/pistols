import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { BigNumberish } from "starknet";
import { QuizPlayer, useQuizQuestion, useQuizPlayerAnswer, useQuizQuestionWinners, useActiveQuizQuestionsByParty, useQuizAnswers } from "/src/stores/quizStore";
import { usePistolsContext } from "/src/hooks/PistolsContext";

const getAnswerLetter = (index: number): string => String.fromCharCode(65 + index);

interface AnswerCardProps {
  option: string;
  index: number;
  choice: number;
  selectedAnswer: number | null;
  playerAnswerNumber: number;
  answerNumber: number;
  isClosed: boolean;
  selectionLocked: boolean;
  isSubmitting: boolean;
  isWaitingForIndexer: boolean;
  isConnected: boolean;
  connectOpener?: { open: () => void };
  onAnswerClick: (choice: number) => void;
  playerAddress: BigNumberish | undefined;
  winners: QuizPlayer[];
  successMessage: string | null;
  errorMessage: string | null;
  percentage: number;
}

const AnswerCard = ({
  option,
  index,
  choice,
  selectedAnswer,
  playerAnswerNumber,
  answerNumber,
  isClosed,
  selectionLocked,
  isSubmitting,
  isWaitingForIndexer,
  isConnected,
  connectOpener,
  onAnswerClick,
  playerAddress,
  winners,
  successMessage,
  errorMessage,
  percentage,
}: AnswerCardProps) => {
  const isSelected = selectedAnswer === choice;
  const isPlayerAnswer = playerAnswerNumber === choice;
  
  const isCorrect = answerNumber === choice && isClosed && answerNumber > 0;
  const isPlayerCorrect = isCorrect && isPlayerAnswer;
  const isPlayerWrong = isClosed && isPlayerAnswer && answerNumber !== choice && answerNumber > 0;
  
  const isAnswerSubmitting = isSelected && (isSubmitting || isWaitingForIndexer);
  const disabled = selectionLocked && !isPlayerAnswer;

  const playerWinner = !playerAddress || !winners || winners.length === 0 ? null : winners.find(winner => BigInt(winner.address) === BigInt(playerAddress));

  let showRewardChip: { type: 'Reward' | 'Error' | 'Success', value: string } | null = null;
  if (isClosed && isPlayerCorrect) {
    showRewardChip = { type: 'Reward', value: `+${playerWinner?.score ?? 0} leaderboard point${playerWinner?.score !== 1 ? 's' : ''}` };
  } else if (!isClosed && isPlayerAnswer) {
    if (errorMessage) {
      showRewardChip = { type: 'Error', value: errorMessage };
    } else if (successMessage) {
      showRewardChip = { type: 'Success', value: successMessage };
    }
  }

  const stateClasses = [
    isSelected && !isClosed ? "quiz-answer-selected" : "",
    isPlayerAnswer && !isClosed ? "quiz-answer-submitted" : "",
    disabled ? "quiz-answer-disabled" : "",
    isCorrect ? "quiz-answer-correct" : "",
    isPlayerWrong ? "quiz-answer-incorrect" : "",
    isAnswerSubmitting ? "quiz-answer-submitting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={`quiz-answer ${stateClasses}`}
      onClick={() =>
        !isConnected ? connectOpener?.open() : onAnswerClick(choice)
      }
      disabled={selectionLocked && isConnected}
      aria-label={`Answer ${getAnswerLetter(index)}: ${option}`}
    >
      <div className="quiz-answer-letter-box">
        <div className="quiz-answer-letter">
          {getAnswerLetter(index)}
        </div>
        {answerNumber > 0 && (
          <div className="quiz-answer-percentage">
            {percentage}%
          </div>
        )}
      </div>
      <div className="quiz-answer-text">
        {option || `Option ${choice}`}
      </div>
      {isPlayerCorrect && (
        <div className="quiz-answer-icon quiz-answer-icon-correct">
          ✓
        </div>
      )}
      {isPlayerWrong && (
        <div className="quiz-answer-icon quiz-answer-icon-wrong">
          ✗
        </div>
      )}
      {showRewardChip && (
        <div 
          className={`quiz-reward-chip ${
            showRewardChip.type === 'Error' ? 'quiz-reward-chip-error' : 
            showRewardChip.type === 'Success' ? 'quiz-reward-chip-success' : ''
          }`}
          aria-label={showRewardChip.type}
        >
          <span className="quiz-reward-chip-label">
            {showRewardChip.type}
          </span>
          <span className="quiz-reward-chip-value">
            {showRewardChip.value}
          </span>
        </div>
      )}
    </button>
  );
};

interface QuizAnswerGridProps {
  partyId: number;
  questionId: number;
  selectedAnswer: number | null;
  isSubmitting: boolean;
  isWaitingForIndexer: boolean;
  onAnswerClick: (choice: number) => void;
  successMessage: string | null;
  errorMessage: string | null;
}

export const QuizAnswerGrid = ({
  partyId,
  questionId,
  selectedAnswer,
  isSubmitting,
  isWaitingForIndexer,
  onAnswerClick,
  successMessage,
  errorMessage,
}: QuizAnswerGridProps) => {
  const { address, isConnected } = useAccount();
  const { connectOpener } = usePistolsContext();
  const { options, answerNumber, isOpen, isClosed } = useQuizQuestion(partyId, questionId);
  const { totalAnswers, answerCounts } = useQuizAnswers(partyId, questionId);
  const { playerAnswerNumber } = useQuizPlayerAnswer(partyId, questionId, address);
  const { winners } = useQuizQuestionWinners(partyId, questionId);
  const { activeQuestionIds } = useActiveQuizQuestionsByParty(partyId);

  // Compute activeQuestionId
  const activeQuestionId = useMemo(() => {
    if (!partyId) return 0;
    return activeQuestionIds[activeQuestionIds.length - 1] ?? 0;
  }, [partyId, activeQuestionIds]);

  // Compute derived values
  const hasAnswered = selectedAnswer > 0;
  const selectionLocked = hasAnswered || isSubmitting || isWaitingForIndexer || isClosed || !isOpen;

  // Smart grid layout
  const gridLayout = useMemo(() => {
    const count = options.length;
    
    const columns = count === 3 || (count >= 5 && count <= 6) ? 3 : 
                    count === 4 ? 2 : 
                    count >= 7 ? 4 : 2;
    
    const rows = count <= 3 ? 1 : 
                 count <= 8 ? 2 : 
                 Math.ceil(count / 4);
    
    return { columns, rows };
  }, [options.length]);

  const answerCards = useMemo(
    () =>
      options.map((option, index) => {
        const choice = index + 1;
        return (
          <AnswerCard
            key={choice}
            option={option}
            index={index}
            choice={choice}
            selectedAnswer={selectedAnswer}
            playerAnswerNumber={playerAnswerNumber}
            answerNumber={answerNumber}
            isClosed={isClosed}
            selectionLocked={selectionLocked}
            isSubmitting={isSubmitting}
            isWaitingForIndexer={isWaitingForIndexer}
            isConnected={isConnected}
            connectOpener={connectOpener}
            onAnswerClick={onAnswerClick}
            playerAddress={address}
            winners={winners}
            successMessage={successMessage}
            errorMessage={errorMessage}
            percentage={totalAnswers > 0 ? Math.round(((answerCounts[choice] ?? 0) / totalAnswers) * 100) : 0}
          />
        );
      }),
    [
      options,
      selectedAnswer,
      playerAnswerNumber,
      answerNumber,
      isClosed,
      selectionLocked,
      isSubmitting,
      isWaitingForIndexer,
      isConnected,
      connectOpener,
      onAnswerClick,
      address,
      winners,
      successMessage,
      errorMessage,
      totalAnswers,
      answerCounts,
    ]
  );
  
  if (options.length === 0 || activeQuestionIds.length === 0) {
    return null;
  }

  return (
    <div className="quiz-answers">
      <div className="quiz-answers-gradient" />
      <div
        className="quiz-answers-grid"
        style={{
          gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
        }}
      >
        {answerCards}
      </div>
    </div>
  );
};

