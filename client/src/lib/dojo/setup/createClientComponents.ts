import { overridableComponent } from "@dojoengine/recs";
import { SetupNetworkResult } from "./setup";

export type ClientComponents = ReturnType<typeof createClientComponents>;

export function createClientComponents({ contractComponents }: SetupNetworkResult) {

  const overridableComponents = Object.keys(contractComponents).reduce((result:any, key:string) => {
    //@ts-ignore
    result[key] = overridableComponent(contractComponents[key]);
    return result;
  }, {}) as typeof contractComponents;

  return {
    ...contractComponents,
    ...overridableComponents,
  };
}