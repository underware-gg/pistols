import { defineContractComponents } from "./contractComponents";
import { world } from "./world";
import { RPCProvider, Query, } from "@dojoengine/core";
import { Account, num } from "starknet";
import { GraphQLClient } from 'graphql-request';
import { getSdk } from '@/generated/graphql';
import manifest from '@/manifest.json'

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;

export async function setupNetwork() {
  
  if (!process.env.NEXT_PUBLIC_WORLD_ADDRESS) throw (`NEXT_PUBLIC_WORLD_ADDRESS is null`)
  if (!process.env.NEXT_PUBLIC_NODE_URL) throw (`NEXT_PUBLIC_NODE_URL is null`)
  if (!process.env.NEXT_PUBLIC_TORII) throw (`NEXT_PUBLIC_TORII is null`)

  // Create a new RPCProvider instance.
  const provider = new RPCProvider(process.env.NEXT_PUBLIC_WORLD_ADDRESS, manifest, process.env.NEXT_PUBLIC_NODE_URL);

  // Return the setup object.
  return {
    provider,
    world,

    // Define contract components for the world.
    contractComponents: defineContractComponents(world),

    // Define the graph SDK instance.
    graphSdk: () => getSdk(new GraphQLClient(process.env.NEXT_PUBLIC_TORII)),

    // Execute function.
    execute: async (signer: Account, contract: string, system: string, call_data: num.BigNumberish[]) => {
      //@ts-ignore
      return provider.execute(signer, contract, system, call_data);
    },

    // read-only function call
    call: async (contract: string, system: string, call_data: num.BigNumberish[]) => {
      return provider.call(contract, system, call_data);
    },

    // Entity query function.
    entity: async (component: string, query: Query) => {
      return provider.entity(component, query);
    },

    // Entities query function.
    entities: async (component: string, partition: number) => {
      return provider.entities(component, partition);
    }
  };
}