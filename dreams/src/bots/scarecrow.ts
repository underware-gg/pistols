#!/usr/bin/env node

import { constants } from '@underware/pistols-sdk/pistols/gen';
import { main, BotContext } from "../main";
import chalk from "chalk";

const botContext: BotContext = {
  profile: constants.BotProfile.Scarecrow,
  description: constants.BOT_PROFILES[constants.BotProfile.Scarecrow],
  emoji: "🎃",
  context: "You are an impredictible playful fool.",
}

main(botContext).catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
