import { BigNumberish } from "starknet";
import player_data from './data/player_data.json';

export type PlayerData = {
  username: string | null;
  duelist_ids: BigNumberish[];
  ring_ids: BigNumberish[];
  iso_timestamp?: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ss+HH:mm)
}

export const cachedPlayerData: Record<string, PlayerData> = player_data;
