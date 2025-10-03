import { BigNumberish } from "starknet";
import player_data from './data/player_data.json';

export type PlayerData = {
  duelist_ids: BigNumberish[];
  username: string | null;
  iso_timestamp?: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ss+HH:mm)
}

export const cachedPlayerData: Record<string, PlayerData> = player_data;
