// import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

import { getContractByName } from '@dojoengine/core';
import { makeDojoAppConfig, NetworkId } from '@underware_gg/pistols-sdk/pistols';
import { bigintToHex, stringToFelt } from '@underware_gg/pistols-sdk/utils';
import { constants } from '@underware_gg/pistols-sdk/pistols/gen';
import { env } from '../env';

const dojoAppConfig = makeDojoAppConfig(env.DEFAULT_NETWORK_ID as NetworkId, undefined);

const game_contract = getContractByName(dojoAppConfig.manifest, dojoAppConfig.namespace, 'game');
const duel_contract = getContractByName(dojoAppConfig.manifest, dojoAppConfig.namespace, 'duel_token');
// const duelist_contract = getContractByName(dojoAppConfig.manifest, dojoAppConfig.namespace, 'duelist_token');

export const PROVIDER_GUIDE = `

<PROVIDER_GUIDE>

Use these to call functions with graphql

  <IMPORTANT_RULES>
    1. If you receive an error, you may need to try again, the error message should tell you what went wrong.
    2. To verify a successful transaction, read the response you get back. You don't need to query anything.
    3. Never include slashes in your calldata.
    4. If some function has a contractAddress equals to '0x0', there is a context error, you can avort and inform the user to contact support.
  </IMPORTANT_RULES>

  <PREMISE_VALUES>
    ${Object.keys(constants.Premise).slice(1).map(key => `${key} : ${constants.getPremiseValue(key as constants.Premise)}`).join('\n    ')}
  </PREMISE_VALUES>

  <MOVES_HASH>
    - Calculate it using your secret salt and moves using the starknet ec.starkCurve.poseidonHashMany() function.
    - The salt is a random number you generate. You must remember it to reveal your moves later.
    - The moves is a number composed by the numeric values of the cards you have selected, from left to right (least significant byte first)
    - Example: the moves [1,2,3,4] becomes 0x04030201
    - hash your salt and moves by calling ec.starkCurve.poseidonHashMany(['0x12345678','0x04030201'])
    - use only 32 bits of the resulting hash (value & 0xffffffff)
  </MOVES_HASH>

  <FUNCTIONS>
    <CREATE_CHALLENGE>
      <DESCRIPTION>
        Creates a new Challenge to another player.
      </DESCRIPTION>
      <PARAMETERS>
        - duelist_id: Your duelist ID (the Challenger)
        - challenged_address: The challenged player's wallet address
        - premise: The premise of the challenge see <PREMISE_VALUES>. Always use the "Training" code
        - quote: The quote of the challenge, a string of 31 characters max, encoded as a fetlt252 short string
        - table_id: The table ID of the challenge. Bots always duel in the "${bigintToHex(stringToFelt(constants.TABLES.PRACTICE))}" table
        - expire_hours: The number of hours before the challenge expires, from 1 to 24
      </PARAMETERS>
      <EXAMPLE>
          {
            "contractAddress": "${duel_contract?.address ?? '0x0'}",
            "entrypoint": "create_duel",
            "calldata": [
              "0x300000001",
              "0x123",
              ${constants.Premise.Lesson},
              "${bigintToHex(stringToFelt("The Quote"))}",
              "${bigintToHex(stringToFelt(constants.TABLES.PRACTICE))}",
              24
            ]
          }
      </EXAMPLE>
    </CREATE_CHALLENGE>

    <COMMIT_MOVES>
      <DESCRIPTION>
        Commit the moves of the Challenger player.
      </DESCRIPTION>
      <PARAMETERS>
        - duelist_id: Your duelist ID (the Challenged)
        - duel_id: The duel ID of the challenge
        - hashed: Your hashed moves. Calculate it according to the <MOVES_HASH> section.
      </PARAMETERS>
      <EXAMPLE>
          {
            "contractAddress": "${game_contract?.address ?? '0x0'}",
            "entrypoint": "commit_moves",
            "calldata": [
              "0x300000001",
              "0x123",
              "0x44332211"
            ]
          }
      </EXAMPLE>
    </COMMIT_MOVES>

    <REVEAL_MOVES>
      <DESCRIPTION>
        Reveal the moves of the Challenger player.
      </DESCRIPTION>
      <PARAMETERS>
        - duelist_id: Your duelist ID (the Challenged)
        - duel_id: The duel ID of the challenge
        - salt: The salt of the challenge. MUST be the same salt used to create "hashed" in the commit_moves() function.
        - moves: The moves of the Challenger player. MUST be the same moves used to create "hashed" in the commit_moves() function.
      </PARAMETERS>
      <EXAMPLE>
          {
            "contractAddress": "${game_contract?.address ?? '0x0'}",
            "entrypoint": "reveal_moves",
            "calldata": [
              "0x300000001",
              "0x123",
              "0x12345678",
              [1,2,3,4]
            ]
          }
      </EXAMPLE>
    </REVEAL_MOVES>

  </FUNCTIONS>
</PROVIDER_GUIDE>
`;
