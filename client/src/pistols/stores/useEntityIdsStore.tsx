import { create } from 'zustand'
import { PistolsEntity } from '@/lib/dojo/hooks/useSdkEntities'
import { BigNumberish } from 'starknet';


//
// Stores only the entity ids from a query, as an array
//
interface EntityIdsState {
  entityIds: BigNumberish[]
  setEntities: (entities: PistolsEntity[]) => void;
  updateEntity: (entity: PistolsEntity) => void;
}

export const createEntityIdsStore = () => {
  return create<EntityIdsState>()((set) => ({
    entityIds: [],
    setEntities: (entities: PistolsEntity[]) => {
      console.warn("setEntities() =>", entities)
      set((state: EntityIdsState) => ({
        entityIds: entities.map(e => e.entityId)
      }))
    },
    updateEntity: (entity: PistolsEntity) => {
      set((state: EntityIdsState) => {
        if (!state.entityIds.includes(BigInt(entity.entityId))) {
          state.entityIds.push(entity.entityId)
        }
        return state
      });
    },
  }))
}
