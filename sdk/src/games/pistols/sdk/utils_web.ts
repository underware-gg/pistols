import type { PistolsEntity, PistolsModelType, PistolsSchemaModelNames } from './types_web';

export const getEntityModel = <M extends PistolsModelType>(entity: PistolsEntity, modelName: PistolsSchemaModelNames): M | undefined => (
  entity?.models.pistols?.[modelName] as M
)

export const entityContainsModels = (entity: PistolsEntity, modelNames: PistolsSchemaModelNames[]): boolean => (
  modelNames.some(modelName => Boolean(entity?.models.pistols?.[modelName]))
)
