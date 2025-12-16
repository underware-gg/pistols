import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useAllStoreModels, useSdkEntitiesGet, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { BigNumberish } from 'starknet'
import { bigintToAddress } from '@underware/pistols-sdk/utils'
import { getPlayernameFromAddress } from './playerStore'

export const useQuizStore = createDojoStore<PistolsSchemaType>();

interface FetchState {
  fetched: boolean | undefined,
  setFetched: (fetched: boolean) => void;
}
const createStore = () => {
  return create<FetchState>()((set, get) => ({
    fetched: undefined,
    setFetched: (fetched: boolean) => set({ fetched: fetched }),
  }))
}
const useQuizFetchStore = createStore();

//--------------------------------
// 'consumer' hooks
//

export const useQuizParty = (quizPartyId: number) => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizParty>(entities, 'QuizParty', [quizPartyId])
  const partyName = useMemo(() => (model?.name ?? ''), [model])
  const description = useMemo(() => (model?.description ?? ''), [model])
  const timestamp_start = useMemo(() => Number(model?.timestamps.start ?? 0), [model])
  const timestamp_end = useMemo(() => Number(model?.timestamps.end ?? 0), [model])
  return {
    partyName,
    description,
    timestamp_start,
    timestamp_end,
  }
}

export const useQuizQuestion = (partyId: number, questionId: number) => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizQuestion>(entities, 'QuizQuestion', [partyId, questionId])
  const question = useMemo(() => model?.question ?? '', [model])
  const description = useMemo(() => model?.description ?? '', [model])
  const options = useMemo(() => model?.options ?? [], [model])
  const answerNumber = useMemo(() => Number(model?.answer_number ?? 0), [model])
  const timestamp_start = useMemo(() => Number(model?.timestamps.start ?? 0), [model])
  const timestamp_end = useMemo(() => Number(model?.timestamps.end ?? 0), [model])
  const isOffChain = useMemo(() => (timestamp_start == 0), [timestamp_start])
  const isOpen = useMemo(() => (timestamp_start > 0 && timestamp_end == 0), [timestamp_start, timestamp_end])
  const isClosed = useMemo(() => (timestamp_end > 0), [timestamp_end])
  const vrf = useMemo(() => BigInt(model?.vrf ?? 0), [model])
  // console.log(`useQuizQuestion() =>`, questionId, timestamp_start, timestamp_end, isOffChain, isOpen, isClosed)
  return {
    question,
    description,
    options,
    answerNumber,
    isOffChain,
    isOpen,
    isClosed,
    vrf,
  }
}

export const useQuizQuestionsByParty = (partyId: number) => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const questionIds = useMemo(() => (
    models.filter((model) => Number(model.party_id ?? 0) === partyId)
      .map((model) => Number(model.question_id))
      .sort((a, b) => (a - b))
  ), [models, partyId])
  return {
    questionIds
  }
}

export const useQuizAllParties = () => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizParty>(entities, 'QuizParty')
  const partyNamesById = useMemo(() => (
    models
      .sort((a, b) => (Number((a.party_id ?? 0)) - Number((b.party_id ?? 0))))
      .reduce((acc, model) => {
        acc[Number(model.party_id ?? 0)] = model.name ?? ''
        return acc
      }, {} as Record<number, string>)
  ), [models])
  return {
    partyNamesById,
  }
}

export const useQuizPlayerAnswer = (partyId: number, questionId: number, player_address: BigNumberish) => {
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizAnswer>(entities, 'QuizAnswer', [partyId, questionId, player_address])
  const playerAnswerNumber = useMemo(() => Number(model?.answer_number ?? 0), [model])
  const playerTimestamp = useMemo(() => Number(model?.timestamp ?? 0), [model])
  return {
    playerAnswerNumber,
    playerTimestamp,
  }
}

export const useQuizAnswers = (partyId: number, questionId: number) => {
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizAnswer>(entities, 'QuizAnswer')
  const answers = useMemo(() => (
    models
      .filter((model) => Number(model?.party_id ?? 0) == partyId)
      .filter((model) => Number(model?.question_id ?? 0) == questionId)
      .sort((a, b) => (Number(a.timestamp) - Number(b.timestamp)))
  ), [models, questionId])
  const playersByAnswer = useMemo(() => (
    answers.reduce((acc, model) => {
      acc[Number(model.answer_number)] = [...(acc[Number(model.answer_number)] ?? []), BigInt(model.player_address)]
      return acc
    }, {} as Record<number, bigint[]>)
  ), [answers])
  const answerCounts = useMemo(() => (
    Object.keys(playersByAnswer).reduce((acc, answerNumber) => {
      acc[answerNumber] = playersByAnswer[answerNumber].length
      return acc
    }, {} as Record<number, number>)
  ), [answers])
  // console.log('>>>>>>>>> useQuizAnswers() =>', answers, playersByAnswer, answerCounts)
  return {
    playersByAnswer,
    answerCounts,
  }
}


//--------------------------------
// Leaderboards
//

export type QuizPlayer = {
  address: BigNumberish,
  name: string,
  score: number,
  wins?: number,
}

export const useQuizQuestionWinners = (partyId: number, questionId: number) => {
  const entities = useQuizStore((state) => state.entities);
  const question_models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const answers_models = useAllStoreModels<models.QuizAnswer>(entities, 'QuizAnswer')
  const winners = useMemo<QuizPlayer[]>(() => (
    _getQuestionWinners(partyId, questionId, question_models, answers_models)
  ), [partyId, questionId, question_models, answers_models])
  return {
    winners,
  }
}

export const useQuizPartyLeaderboards = (partyId: number) => {
  const entities = useQuizStore((state) => state.entities);
  const question_models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const answers_models = useAllStoreModels<models.QuizAnswer>(entities, 'QuizAnswer')
  const leaderboards = useMemo<QuizPlayer[]>(() => (
    _getQuizPartyLeaderboards(partyId, question_models, answers_models)
  ), [partyId, question_models, answers_models])
  return {
    leaderboards,
  }
}


const _getQuestionWinners = (partyId: number, questionId: number, question_models: models.QuizQuestion[], answer_models: models.QuizAnswer[]): QuizPlayer[] => {
  // find question and correct answer
  const question = question_models
    .find((model) => Number(model?.party_id ?? 0) == partyId && Number(model?.question_id ?? 0) == questionId)
  const answerNumber = Number(question?.answer_number ?? 0)
  // find all players who answered the correct answer, sorted by timestamp
  const answers = answer_models
    .filter((model) => Number(model?.party_id ?? 0) == partyId)
    .filter((model) => Number(model?.question_id ?? 0) == questionId)
    .filter((model) => Number(model?.answer_number ?? 0) == answerNumber)
    .sort((a, b) => (Number(a.timestamp) - Number(b.timestamp)))
  // calculate score for each player
  const players = answers
    .map((model, i) => ({
      address: bigintToAddress(model.player_address),
      name: getPlayernameFromAddress(model.player_address),
      score: 1000 + ((answers.length - i - 1) * 10),
      wins: 1,
    }))
  // decide winners from question vrf
  const vrf = BigInt(question?.vrf ?? 0)
  const result = players.sort((a, b) => {
    const aa = Number((BigInt(a.address) ^ vrf) & 0xffffffffn)
    const bb = Number((BigInt(b.address) ^ vrf) & 0xffffffffn)
    console.log(`_getQuestionWinners() =>`, aa, bb)
    return (bb - aa)
  })
  return result;
}

const _getQuizPartyLeaderboards = (partyId: number, question_models: models.QuizQuestion[], answer_models: models.QuizAnswer[]): QuizPlayer[] => {
  const result: QuizPlayer[] = [];
  // find all questions for this party
  const questions = question_models
    .filter((model) => Number(model?.party_id ?? 0) == partyId)
  // combine winners of all questions
  questions.forEach((question) => {
    const winners = _getQuestionWinners(partyId, Number(question?.question_id ?? 0), question_models, answer_models)
    winners.forEach((winner) => {
      const index = result.findIndex((player) => player.address == winner.address);
      if (index == -1) {
        result.push(winner)
      } else {
        result[index].score += winner.score
        result[index].wins += winner.wins
      }
    })
  })
  // sort result by score
  result.sort((a, b) => (b.score - a.score))
  return result;
}




//--------------------------------
// fetch all quizes into client
//
const query_get_entities: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
    'pistols-QuizParty',
    'pistols-QuizQuestion',
    'pistols-QuizAnswer',
  ])
  .withLimit(1000)
  .includeHashedKeys();
export const useFetchAllQuiz = () => {
  const quizFetchStore = useQuizFetchStore((state) => state);
  const quizState = useQuizStore((state) => state);

  const mounted = useMounted();
  const enabled = (mounted && !quizFetchStore.fetched);

  useSdkEntitiesGet({
    query: query_get_entities,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      // console.log('>>>>>>>>> useFetchAllQuiz() setEntities =>', entities)
      entities.forEach((entity) => {
        quizState.updateEntity(entity)
      })
      quizFetchStore.setFetched(true)
    },
  })
  useEffect(() => {
    if (enabled) quizFetchStore.setFetched(false)
  }, [enabled])

  return {}
}
