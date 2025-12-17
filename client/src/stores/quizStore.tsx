import { useMemo } from 'react'
import { create } from 'zustand'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useAllStoreModels, useSdkEntitiesGet, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { BigNumberish } from 'starknet'
import { getPlayernameFromAddress } from './playerStore'
import { calculateQuestionWinners_v2_complex } from './quizScoring'

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
    isPartyClosed: (timestamp_end > 0),
  }
}

export const useQuizQuestion = (partyId: number, questionId: number) => {
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizQuestion>(entities, 'QuizQuestion', [partyId, questionId])
  const question = useMemo(() => model?.question ?? '', [model])
  const description = useMemo(() => model?.description ?? '', [model])
  const hint = useMemo(() => model?.hint ?? '', [model])
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
    hint,
    options,
    answerNumber,
    isOffChain,
    isOpen,
    isClosed,
    vrf,
  }
}

export const useQuizQuestionsByParty = (partyId: number) => {
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

export const useActiveQuizQuestionsByParty = (partyId: number) => {
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const activeQuestionIds = useMemo(() => (
    models.filter((model) => Number(model.party_id ?? 0) === partyId && Number(model.timestamps.start ?? 0) > 0)
      .map((model) => Number(model.question_id))
      .sort((a, b) => (a - b))
  ), [models, partyId])
  return {
    activeQuestionIds
  }
}

export const useQuizAllParties = () => {
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

export const useQuizPartyByName = (partyName: string) => {
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizParty>(entities, "QuizParty");

  const partyData = useMemo(() => {
    if (!partyName) return null;
    return models.find((model) => model.name.toLowerCase().replaceAll(' ', '') === partyName.toLowerCase().replaceAll(' ', '')) ?? null;
  }, [models, partyName]);

  const partyId = useMemo(() => {
    return partyData ? Number(partyData.party_id ?? 0) : 0;
  }, [partyData]);

  return {
    partyId,
    partyName: partyData?.name ?? "",
    description: partyData?.description ?? "",
    timestamp_start: Number(partyData?.timestamps.start ?? 0),
    timestamp_end: Number(partyData?.timestamps.end ?? 0),
    isPartyClosed: Number(partyData?.timestamps.end ?? 0) > 0,
    quizQuestionCount: Number(partyData?.quiz_question_count ?? 0),
  };
};


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
  ), [playersByAnswer])
  const totalAnswers = useMemo(() => (
    Object.values(answerCounts).reduce((sum, count) => sum + count, 0)
  ), [answerCounts])
  // console.log('>>>>>>>>> useQuizAnswers() =>', answers, playersByAnswer, answerCounts)
  return {
    playersByAnswer,
    answerCounts,
    totalAnswers,
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

export const useQuizPartyLeaderboards = (partyId: number, questionsLimit?: number) => {
  const entities = useQuizStore((state) => state.entities);
  const question_models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const answers_models = useAllStoreModels<models.QuizAnswer>(entities, 'QuizAnswer')
  const leaderboards = useMemo<QuizPlayer[]>(() => (
    _getQuizPartyLeaderboards(partyId, question_models.filter((model) => !questionsLimit || Number(model?.question_id ?? 0) <= questionsLimit), answers_models)
  ), [partyId, question_models, answers_models, questionsLimit])
  return {
    leaderboards,
  }
}


// See quizScoring.ts for full implementation
const _getQuestionWinners = (partyId: number, questionId: number, question_models: models.QuizQuestion[], answer_models: models.QuizAnswer[]): QuizPlayer[] => {
  return calculateQuestionWinners_v2_complex(
    partyId,
    questionId,
    question_models,
    answer_models,
    getPlayernameFromAddress
  )
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
export const useFetchAllQuiz = () => {
  const quizFetchStore = useQuizFetchStore((state) => state);
  const quizState = useQuizStore((state) => state);

  const mounted = useMounted();

  const query = useMemo(
    () =>
      new PistolsQueryBuilder()
        .withEntityModels([
          'pistols-QuizParty',
          'pistols-QuizQuestion',
          'pistols-QuizAnswer',
        ])
        .withLimit(1000)
        .includeHashedKeys(),
    []
  );

  const enabled = mounted && !quizFetchStore.fetched;

  useSdkEntitiesGet({
    query,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      // console.log('>>>>>>>>> useFetchAllQuiz() setEntities =>', entities)
      entities.forEach((entity) => {
        quizState.updateEntity(entity)
      })
      if (entities.length > 0) quizFetchStore.setFetched(true)
    },
  })

  return {}
}
