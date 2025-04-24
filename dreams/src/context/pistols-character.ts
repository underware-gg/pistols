import { getProfileGender, makeCharacterDuelistId } from '@underware/pistols-sdk/pistols';
import { constants } from '@underware/pistols-sdk/pistols/gen';
import { BotContext } from "../main";

export const buildCharacter = (botContext: BotContext) => (`
<CHARACTER>

  Your name is ${botContext.description.name}
  Your gender is ${getProfileGender(constants.DuelistProfile.Bot, botContext.duelist_profile)}
  Your duelist ID is ${makeCharacterDuelistId(constants.DuelistProfile.Bot, botContext.duelist_profile)}
  
  <PERSONALITY>
    ${botContext.context}
  </PERSONALITY>

</CHARACTER>
`);
