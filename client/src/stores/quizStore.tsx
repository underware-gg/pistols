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
export const useQuizConfig = () => {
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsById<models.QuizConfig>(entities, 'QuizConfig', configKey)
  const quizCount = useMemo(() => Number(model?.quiz_count ?? 0), [model])
  const currentQuizId = useMemo(() => Number(model?.current_quiz_id ?? 0), [model])
  return {
    quizCount,
    currentQuizId,
  }
}

export const useQuizQuestion = (quizId: number) => {
  useFetchAllQuiz();
  const entities = useQuizStore((state) => state.entities);
  const model = useStoreModelsByKeys<models.QuizQuestion>(entities, 'QuizQuestion', [quizId])
  const eventName = useMemo(() => feltToString(model?.quiz_event ?? 0), [model])
  const question = useMemo(() => model?.question ?? '', [model])
  const options = useMemo(() => model?.options ?? [], [model])
  const answerNumber = useMemo(() => Number(model?.answer_number ?? 0), [model])
  const isOpen = useMemo(() => model?.is_open ?? false, [model])
  return {
    eventName,
    question,
    options,
    answerNumber,
    isOpen,
  }
}

export const useQuizQuestionsByEvent = (eventName: string) => {
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


//--------------------------------
// fetch all quizes into client
//
const query_get_entities: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(["pistols-QuizQuestion"])
  .withLimit(1000)
  .includeHashedKeys();
const query_get_events: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(["pistols-QuizAnswerEvent"])
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
      console.log('>>>>>>>>> useFetchAllQuiz() setEntities =>', entities)
      quizState.setEntities(entities)
      quizFetchStore.setFetched(true)
    },
  })
  useSdkEventsGet({
    query: query_get_events,
    enabled,
    setEntities: (entities: PistolsEntity[]) => {
      console.log('>>>>>>>>> useFetchAllQuiz() setEntities =>', entities)
      quizState.setEntities(entities)
      quizFetchStore.setFetched(true)
    },
  })
  useEffect(() => {
    if (enabled) quizFetchStore.setFetched(false)
  }, [enabled])

  return {}
}
