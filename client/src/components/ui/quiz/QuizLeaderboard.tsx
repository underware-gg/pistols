import { useQuizPartyLeaderboards } from "/src/stores/quizStore";

interface QuizLeaderboardProps {
  partyId: number;
  isPartyClosed: boolean;
  isLeaderboardOpen: boolean;
  onToggleLeaderboard: () => void;
}

export const QuizLeaderboard = ({ 
  partyId, 
  isPartyClosed, 
  isLeaderboardOpen,
  onToggleLeaderboard,
}: QuizLeaderboardProps) => {
  const { leaderboards } = useQuizPartyLeaderboards(partyId);

  if (leaderboards.length === 0) return null;

  return (
    <>
      <button
        className={`quiz-leaderboard-toggle ${
          isLeaderboardOpen ? "quiz-leaderboard-toggle-open" : ""
        }`}
        onClick={onToggleLeaderboard}
        aria-label={
          isLeaderboardOpen ? "Hide leaderboard" : "Show leaderboard"
        }
      >
        <span className="quiz-leaderboard-toggle-icon">‹</span>
      </button>

      <div
        className={`quiz-leaderboard ${
          isLeaderboardOpen
            ? "quiz-leaderboard-visible"
            : "quiz-leaderboard-hidden"
        }`}
      >
        <div className="quiz-leaderboard-content">
          <div className="quiz-leaderboard-title">
            {isPartyClosed ? "Final Standings" : "Leaderboard"}
          </div>
          <div className="quiz-leaderboard-list">
            {(() => {
              let currentRank = 1;
              let isFirstPlayer = true;
              return leaderboards.map((player, index) => {
                if (
                  index > 0 &&
                  leaderboards[index - 1].score !== player.score
                ) {
                  currentRank++;
                  isFirstPlayer = true;
                } else if (index > 0) {
                  isFirstPlayer = false;
                }

                const ribbonImage =
                  currentRank <= 3
                    ? `/images/ui/card_rank_${currentRank}.png`
                    : `/images/ui/card_rank.png`;

                return (
                  <div key={player.address} className="quiz-leaderboard-item">
                    <div className="quiz-leaderboard-rank-container">
                      <div
                        className="quiz-leaderboard-item-ribbon"
                        style={{ backgroundImage: `url("${ribbonImage}")` }}
                      />
                      <span className="quiz-leaderboard-rank">
                        {isFirstPlayer ? currentRank : "="}
                      </span>
                    </div>
                    <div
                      className="quiz-leaderboard-name"
                      title={player.name}
                    >
                      <span className="quiz-leaderboard-name-text">
                        {player.name}
                      </span>
                    </div>
                    <span className="quiz-leaderboard-score">
                      {player.score}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </>
  );
};

