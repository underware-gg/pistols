import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createDojoStore } from '@dojoengine/sdk/react'
import { feltToString } from '@underware/pistols-sdk/starknet'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useAllStoreModels, useSdkEntitiesGet, useSdkEventsGet, useStoreModelsById, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { configKey } from './configStore'
import { BigNumberish } from 'starknet'
import { bigintToAddress, shortAddress } from '@underware/pistols-sdk/utils'
import { getPlayernameFromAddress } from './playerStore'

export const useQuizStore = createDojoStore<PistolsSchemaType>();

interface FetchState {
  fetched: boolean | undefined,
  setFetched: (fetched: boolean) => void;
}
const createStore = () => {
  return create<FetchState>()(immer((set, get) => ({
    fetched: undefined,
    setFetched: (fetched: boolean) => {
      set((state: FetchState) => {
        state.fetched = fetched
      })
    },
  })))
}
const useQuizFetchStore = createStore();

//--------------------------------
// 'consumer' hooks
//

export const useQuizQuestion = (quizId: number) => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizQuestion>(entities, 'QuizQuestion', [quizId])
  const eventName = useMemo(() => feltToString(model?.quiz_event ?? 0), [model])
  const question = useMemo(() => model?.question ?? '', [model])
  const description = useMemo(() => model?.description ?? '', [model])
  const options = useMemo(() => model?.options ?? [], [model])
  const answerNumber = useMemo(() => Number(model?.answer_number ?? 0), [model])
  const timestamp_start = useMemo(() => Number(model?.timestamps.start ?? 0), [model])
  const timestamp_end = useMemo(() => Number(model?.timestamps.end ?? 0), [model])
  const isOffChain = useMemo(() => (timestamp_start == 0), [timestamp_start])
  const isOpen = useMemo(() => (timestamp_start > 0 && timestamp_end == 0), [timestamp_start, timestamp_end])
  const isClosed = useMemo(() => (timestamp_end > 0), [timestamp_end])
  // console.log(`useQuizQuestion() =>`, quizId, timestamp_start, timestamp_end, isOffChain, isOpen, isClosed)
  return {
    eventName,
    question,
    description,
    options,
    answerNumber,
    isOffChain,
    isOpen,
    isClosed,
  }
}

export const useQuizQuestionsByEventName = (eventName: string) => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const quizIds = useMemo(() => (
    models.filter((model) => feltToString(model.quiz_event ?? 0) === eventName)
      .map((model) => Number(model.quiz_id))
      .sort((a, b) => (a - b))
  ), [models, eventName])
  return {
    quizIds
  }
}

export const useQuizAllEventNames = () => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  const eventNames = useMemo(() => (
    models
      .map((model) => feltToString(model.quiz_event ?? 0))
      .filter((eventName) => eventName.length > 0)
      .reduce((acc, current) => {
        if (!acc.includes(current)) acc.push(current);
        return acc;
      }, [] as string[])
      .sort((a, b) => (a.localeCompare(b)))
  ), [models])
  return {
    eventNames,
  }
}

export const useQuizPlayerAnswer = (quizId: number, player_address: BigNumberish) => {
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizAnswer>(entities, 'QuizAnswer', [quizId, player_address])
  const playerAnswerNumber = useMemo(() => Number(model?.answer_number ?? 0), [model])
  const playerTimestamp = useMemo(() => Number(model?.timestamp ?? 0), [model])
  return {
    playerAnswerNumber,
    playerTimestamp,
  }
}

export const useQuizAnswers = (quizId: number) => {
  const entities = useQuizStore((state) => state.entities);
  const models = useAllStoreModels<models.QuizAnswer>(entities, 'QuizAnswer')
  const answers = useMemo(() => (
    models
      .filter((model) => Number(model?.quiz_id ?? 0) == quizId)
      .sort((a, b) => (Number(a.timestamp) - Number(b.timestamp)))
  ), [models, quizId])
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

export const useQuizWinners = (quizId: number) => {
  const { answerNumber } = useQuizQuestion(quizId)
  const { playersByAnswer } = useQuizAnswers(quizId)
  const winners = useMemo(() => {
    if (answerNumber == 0) return [];
    const addresses = (playersByAnswer[answerNumber] ?? []);
    return addresses.map((address) => ({
      address: bigintToAddress(address),
      name: getPlayernameFromAddress(address) // ?? shortAddress(address),
    }));
  }, [playersByAnswer, answerNumber])
  // console.log('>>>>>>>>> useQuizWinners() =>', quizId, answerNumber, winners)
  return {
    winners,
  }
}




//--------------------------------
// fetch all quizes into client
//
const query_get_entities: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
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
