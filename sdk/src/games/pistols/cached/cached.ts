import { BigNumberish } from "starknet";
import player_data from './data/player_data.json';

export type PlayerData = {
  duelist_ids: BigNumberish[];
  username?: string | undefined;
}

export const cachedPlayerData: Record<string, PlayerData> = player_data;
