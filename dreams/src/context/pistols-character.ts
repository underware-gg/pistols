import { makeCharacterDuelistId } from '@underware_gg/pistols-sdk/pistols';
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { BotContext } from "../main";

export const buildCharacter = (botContext: BotContext) => (`
<character>
  Your name is ${botContext.description.name}
  Your gender is ${botContext.description.gender}
  Your duelist ID is ${makeCharacterDuelistId(constants.ProfileType.Bot, botContext.profile)}
  
  About your personality: ${botContext.context}
</character>
`);
