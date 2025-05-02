#!/usr/bin/env node

import { constants } from '@underware/pistols-sdk/pistols/gen';
import { main, BotContext } from "../main";
import chalk from "chalk";

const botContext: BotContext = {
  duelist_profile: constants.BotKey.Scarecrow,
  description: constants.BOT_PROFILES[constants.BotKey.Scarecrow],
  emoji: "🎃",
  context: "You are an impredictible playful fool.",
}

main(botContext).catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
