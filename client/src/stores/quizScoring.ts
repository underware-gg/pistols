import { BigNumberish } from 'starknet'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { bigintToAddress } from '@underware/pistols-sdk/utils'
import { QuizPlayer } from './quizStore'

//--------------------------------
// Constants
//

const BASE_SCORE = 1000
const POINTS_PER_10_SECONDS = 50 // Points removed per 10 seconds of question duration
const MAX_POINTS_REMOVED = 500 // Maximum points that can be removed
const EXTREME_GAP_MULTIPLIER = 3 // Gaps >3x average are considered extreme
const BONUS_CAP_RATIO = 0.75 // Bonus (faster blocks) capped at 75% of per-block difference - generous!
const PENALTY_CAP_RATIO = 0.25 // Penalty (slower blocks) capped at 25% of per-block difference - lenient!

//--------------------------------
// Helper Functions
//

/**
 * Calculate dynamic minimum score based on question duration
 * For every 10 seconds, remove POINTS_PER_10_SECONDS points, capped at MAX_POINTS_REMOVED
 * Example: 60 seconds = 300 points removed, 120+ seconds = MAX_POINTS_REMOVED points removed
 */
const calculateMinScore = (questionDuration: number): number => {
  if (questionDuration <= 0) return BASE_SCORE - MAX_POINTS_REMOVED // Default fallback
  
  const pointsToRemove = Math.min(
    Math.floor(questionDuration / 10) * POINTS_PER_10_SECONDS,
    MAX_POINTS_REMOVED
  )
  
  return BASE_SCORE - pointsToRemove
}

/**
 * Calculate average block interval, excluding extreme gaps (>3x average)
 * Returns the refined average after filtering extremes
 */
const calculateAverageBlockInterval = (sortedTimestamps: number[]): number => {
  if (sortedTimestamps.length < 2) return 0
  
  // Calculate all intervals
  const intervals: number[] = []
  for (let i = 1; i < sortedTimestamps.length; i++) {
    intervals.push(sortedTimestamps[i] - sortedTimestamps[i - 1])
  }
  
  if (intervals.length === 0) return 0
  
  // Calculate initial average
  const initialAverage = intervals.reduce((sum, gap) => sum + gap, 0) / intervals.length
  
  // Filter out extremes (>3x average) and recalculate
  const filteredIntervals = intervals.filter(gap => gap <= initialAverage * EXTREME_GAP_MULTIPLIER)
  
  if (filteredIntervals.length === 0) return initialAverage

  return filteredIntervals.reduce((sum, gap) => sum + gap, 0) / filteredIntervals.length
}

//--------------------------------
// Main Scoring Function
//

/**
 * Block-based time scaling with gap adjustments
 * 
 * Features:
 * - Dynamic min score based on question duration
 * - First answer time → max points (1000)
 * - Question end time → min points (calculated)
 * - Last answer time determines where last block falls on scale
 * - Blocks distributed evenly, then adjusted based on actual time gaps vs average
 * - Faster blocks move closer to previous (up to BONUS_CAP_RATIO of per-block difference)
 * - Slower blocks move closer to next (up to PENALTY_CAP_RATIO of per-block difference)
 * - Extreme gaps (>3x average) are excluded from average calculation
 */
export const calculateQuestionWinners_v2_complex = (
  partyId: number,
  questionId: number,
  question_models: models.QuizQuestion[],
  answer_models: models.QuizAnswer[],
  getPlayernameFromAddress: (address: BigNumberish) => string
): QuizPlayer[] => {
  //--------------------------------
  // 1. Get question data and filter answers
  //
  
  const question = question_models
    .find((model) => Number(model?.party_id ?? 0) === partyId && Number(model?.question_id ?? 0) === questionId)
  
  if (!question) return []
  
  const answerNumber = Number(question?.answer_number ?? 0)
  const questionStart = Number(question?.timestamps.start ?? 0)
  const questionEnd = Number(question?.timestamps.end ?? 0)
  
  // Get all answers (including wrong ones) to find first answer time
  const allAnswers = answer_models
    .filter((model) => Number(model?.party_id ?? 0) === partyId)
    .filter((model) => Number(model?.question_id ?? 0) === questionId)
    .sort((a, b) => (Number(a.timestamp) - Number(b.timestamp)))
  
  // Get correct answers only
  const correctAnswers = allAnswers
    .filter((model) => Number(model?.answer_number ?? 0) === answerNumber)
  
  if (correctAnswers.length === 0) return []
  
  // First answer time (even if wrong) - reference point for max points
  const firstAnswerTime = allAnswers.length > 0 ? Number(allAnswers[0].timestamp) : questionStart
  const lastAnswerTime = allAnswers.length > 0 ? Number(allAnswers[allAnswers.length - 1].timestamp) : questionEnd
  
  //--------------------------------
  // 2. Group ALL answers by timestamp (blocks) - for average calculation
  //
  
  // Group all answers (wrong + correct) to calculate realistic average intervals
  const allTimestampGroups = new Map<number, typeof allAnswers>()
  allAnswers.forEach((model) => {
    const ts = Number(model.timestamp)
    if (!allTimestampGroups.has(ts)) {
      allTimestampGroups.set(ts, [])
    }
    allTimestampGroups.get(ts)!.push(model)
  })
  const allSortedTimestamps = Array.from(allTimestampGroups.keys()).sort((a, b) => a - b)
  
  //--------------------------------
  // 3. Group CORRECT answers by timestamp (blocks) - for scoring
  //
  
  const timestampGroups = new Map<number, typeof correctAnswers>()
  correctAnswers.forEach((model) => {
    const ts = Number(model.timestamp)
    if (!timestampGroups.has(ts)) {
      timestampGroups.set(ts, [])
    }
    timestampGroups.get(ts)!.push(model)
  })
  
  const sortedTimestamps = Array.from(timestampGroups.keys()).sort((a, b) => a - b)
  
  if (sortedTimestamps.length === 0) return []
  
  //--------------------------------
  // 4. Calculate dynamic min score based on question duration
  //
  
  const questionDuration = questionEnd > 0 ? questionEnd - questionStart : 0
  const minScore = calculateMinScore(questionDuration)
  const maxScore = BASE_SCORE
  
  //--------------------------------
  // 5. Calculate average block interval from ALL answers (excluding extremes)
  // This gives us a more realistic average of when people are actually answering
  //
  
  const averageBlockInterval = calculateAverageBlockInterval(allSortedTimestamps)
  
  //--------------------------------
  // 6. Calculate base scores: evenly distribute ALL blocks (wrong + correct) between first and last
  //
  
  const numAllBlocks = allSortedTimestamps.length
  const timeRange = questionEnd > 0 ? questionEnd - firstAnswerTime : 0
  
  // Calculate score for last based on their timestamp positions
  const lastBlockPosition = timeRange > 0 ? (lastAnswerTime - firstAnswerTime) / timeRange : 0
  const lastBlockScore = maxScore - (lastBlockPosition * (maxScore - minScore))

  // Calculate per-block difference for gap adjustments
  const perBlockDifference = numAllBlocks > 1 ? (maxScore - lastBlockScore) / (numAllBlocks - 1) : 0
  
  // Create score map for ALL blocks - evenly distributed
  const allBlockScores = new Map<number, number>()
  allSortedTimestamps.forEach((timestamp, index) => {
    if (index === 0) {
      allBlockScores.set(timestamp, maxScore)
    } else if (index === numAllBlocks - 1) {
      allBlockScores.set(timestamp, lastBlockScore)
    } else {
      // Evenly distributed between first and last
      
      const baseScore = maxScore - (index * perBlockDifference)
      allBlockScores.set(timestamp, baseScore)
    }
  })
  
  //--------------------------------
  // 7. Apply gap adjustments to ALL answer blocks
  //
  
  if (averageBlockInterval > 0 && numAllBlocks > 1) {
    const bonusCap = Math.abs(perBlockDifference * BONUS_CAP_RATIO)
    const penaltyCap = Math.abs(perBlockDifference * PENALTY_CAP_RATIO)
    
    for (let i = 1; i < allSortedTimestamps.length; i++) {
      const currentTimestamp = allSortedTimestamps[i]
      const previousTimestamp = allSortedTimestamps[i - 1]
      const actualGap = currentTimestamp - previousTimestamp
      
      // Calculate adjustment based on gap difference
      const gapDifference = actualGap - averageBlockInterval
      const gapRatio = gapDifference / averageBlockInterval
      
      // Adjustment: faster = bonus, slower = penalty
      let adjustment: number
      if (gapDifference < 0) {
        adjustment = -gapRatio * bonusCap
        adjustment = Math.min(adjustment, bonusCap)
      } else {
        adjustment = -gapRatio * penaltyCap
        adjustment = Math.max(adjustment, -penaltyCap)
      }
      
      // Apply adjustment to block score
      const currentBaseScore = allBlockScores.get(currentTimestamp) ?? maxScore
      
      if (i < numAllBlocks - 1) {
        // Not last block: apply adjustment
        allBlockScores.set(currentTimestamp, currentBaseScore + adjustment)
      } else {
        // Last block: only adjust if extreme gap (minimal penalty)
        if (actualGap > averageBlockInterval * EXTREME_GAP_MULTIPLIER) {
          allBlockScores.set(currentTimestamp, currentBaseScore - (penaltyCap * 0.5))
        }
      }
    }
  }
  
  //--------------------------------
  // 8. Calculate scores for each player
  //
  
  const players: QuizPlayer[] = []
  
  // Assign scores to players (only correct answers get points)
  sortedTimestamps.forEach((timestamp) => {
    const correctAnswersAtTimestamp = timestampGroups.get(timestamp) || []
    const score = allBlockScores.get(timestamp) ?? maxScore
    const roundedScore = Math.round(score)
    
    correctAnswersAtTimestamp.forEach((model) => {
      players.push({
        address: bigintToAddress(model.player_address),
        name: getPlayernameFromAddress(model.player_address),
        score: roundedScore,
        wins: 1,
      })
    })
  })
  
  //--------------------------------
  // 9. Apply VRF tiebreaker
  //
  
  const vrf = BigInt(question?.vrf ?? 0)
  const result = players.sort((a, b) => {
    const aa = Number((BigInt(a.address) ^ vrf) & 0xffffffffn)
    const bb = Number((BigInt(b.address) ^ vrf) & 0xffffffffn)
    return (bb - aa)
  })
  
  return result
}
 