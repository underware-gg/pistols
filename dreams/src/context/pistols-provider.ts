// import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import { DEFAULT_NETWORK_ID } from '@underware_gg/pistols-sdk/pistols'
import { getContractByName } from '@dojoengine/core'

const dojoAppConfig = makeDojoAppConfig(DEFAULT_NETWORK_ID, undefined);

const game_contract = getContractByName(dojoAppConfig.manifest, dojoAppConfig.namespace, 'game');
const duel_contract = getContractByName(dojoAppConfig.manifest, dojoAppConfig.namespace, 'duel_token');
const duelist_contract = getContractByName(dojoAppConfig.manifest, dojoAppConfig.namespace, 'duelist_token');

export const PROVIDER_GUIDE = `

<PROVIDER_GUIDE>

Use these to call functions with graphql

  <IMPORTANT_RULES>
    1. If you receive an error, you may need to try again, the error message should tell you what went wrong.
    2. To verify a successful transaction, read the response you get back. You don't need to query anything.
    3. Never include slashes in your calldata.
  </IMPORTANT_RULES>

  <FUNCTIONS>
    <CREATE_ORDER>
      <DESCRIPTION>
        Creates a new trade order between realms.
      </DESCRIPTION>
      <PARAMETERS>
        - maker_id: ID of the realm creating the trade
        - maker_gives_resources: Resources the maker is offering
        - taker_id: ID of the realm that can accept the trade
        - taker_gives_resources: Resources requested from the taker
        - signer: Account executing the transaction
        - expires_at: When the trade expires
      </PARAMETERS>
      <EXAMPLE>
     
          {
            "contractAddress": "<eternum-trade_systems>",
            "entrypoint": "create_order",
            "calldata": [
              123,         
              1,           
              1,           
              100,         
              456,         
              1,           
              2,           
              50,          
              1704067200   
            ]
          }
  
      </EXAMPLE>
    </CREATE_ORDER>

    <ACCEPT_ORDER>
      <DESCRIPTION>
        Accepts an existing trade order.
      </DESCRIPTION>
      <PARAMETERS>
        - taker_id: ID of the realm accepting the trade
        - trade_id: ID of the trade being accepted
        - maker_gives_resources: Resources the maker is offering
        - taker_gives_resources: Resources requested from the taker
        - signer: Account executing the transaction
      </PARAMETERS>
      <EXAMPLE>
        <JSON>
          {
            "contractAddress": "<eternum-trade_systems>",
            "entrypoint": "accept_order",
            "calldata": [
              123,
              789,
              1,
              1,
              100,
              1,
              2,
              50
            ]
          }
        </JSON>
      </EXAMPLE>
    </ACCEPT_ORDER>

    <ACCEPT_PARTIAL_ORDER>
      <DESCRIPTION>
        Accepts a portion of an existing trade order.
      </DESCRIPTION>
      <PARAMETERS>
        - taker_id: ID of the realm accepting the trade
        - trade_id: ID of the trade being accepted
        - maker_gives_resources: Resources the maker is offering
        - taker_gives_resources: Resources requested from the taker
        - taker_gives_actual_amount: Actual amount taker will give
        - signer: Account executing the transaction
      </PARAMETERS>
      <EXAMPLE>
        <JSON>
          {
            "contractAddress": "<eternum-trade_systems>",
            "entrypoint": "accept_partial_order",
            "calldata": [
              123,
              789,
              1,
              1,
              100,
              1,
              2,
              50,
              25
            ]
          }
        </JSON>
      </EXAMPLE>
    </ACCEPT_PARTIAL_ORDER>

    <CANCEL_ORDER>
      <DESCRIPTION>
        Cancels an existing trade order.
      </DESCRIPTION>
      <PARAMETERS>
        - trade_id: ID of the trade to cancel
        - return_resources: Resources to return
        - signer: Account executing the transaction
      </PARAMETERS>
      <EXAMPLE>
        <JSON>
          {
            "contractAddress": "<eternum-trade_systems>",
            "entrypoint": "cancel_order",
            "calldata": [
              789,
              1,
              1,
              100
            ]
          }
        </JSON>
      </EXAMPLE>
    </CANCEL_ORDER>

    <CREATE_BUILDING>
      <DESCRIPTION>
        Creates a new building for a realm on the hexagonal grid map.
      </DESCRIPTION>
      <PARAMETERS>
        - entity_id: ID of the realm creating the building (required)
        - directions: Array of directions from castle to building location (required)
        - building_category: Type of building (required)
        - produce_resource_type: Resource type ID this building will produce (required for resource buildings)
      </PARAMETERS>
      <NOTES>
        Never use 0 for produce_resource_type, always use the resource type ID - eg: fish is 1, wheat is 1, etc.
      </NOTES>
      
      <PLACEMENT_GUIDE>
        <DESCRIPTION>
          The map uses a hexagonal grid with your realm's castle at the center (0,0). 
          Buildings are placed by specifying directions outward from the castle.
        </DESCRIPTION>
        
        <DIRECTION_IDS>
          0 = East (→)
          1 = Northeast (↗) 
          2 = Northwest (↖)
          3 = West (←)
          4 = Southwest (↙) 
          5 = Southeast (↘)
        </DIRECTION_IDS>

        <KEY_RULES>
          1. Cannot build on castle location (0,0)
          2. Building distance from castle is limited by realm level
          3. Each direction in the array represents one hex step from castle
          4. Location is determined by following directions sequentially
        </KEY_RULES>

        <RESOURCE_TYPES>
          <BASIC_RESOURCES>
            Stone (1)
            Coal (2) 
            Wood (3)
            Copper (4)
            Ironwood (5)
            Obsidian (6)
          </BASIC_RESOURCES>

          <PRECIOUS_RESOURCES>
            Gold (7)
            Silver (8)
            Mithral (9)
            AlchemicalSilver (10)
            ColdIron (11)
          </PRECIOUS_RESOURCES>

          <RARE_RESOURCES>
            DeepCrystal (12)
            Ruby (13)
            Diamonds (14)
            Hartwood (15)
            Ignium (16)
            TwilightQuartz (17)
            TrueIce (18)
            Adamantine (19)
            Sapphire (20)
            EtherealSilica (21)
            Dragonhide (22)
          </RARE_RESOURCES>

          <SPECIAL_RESOURCES>
            AncientFragment (29)
            Donkey (249)
            Knight (250)
            Crossbowman (251)
            Paladin (252)
            Lords (253)
            Wheat (1)
            Fish (1)
          </SPECIAL_RESOURCES>
        </RESOURCE_TYPES>
      </PLACEMENT_GUIDE>

      <EXAMPLE>
        <DESCRIPTION>
          Create a wood production building one hex northeast of castle:
        </DESCRIPTION>
        <JSON>
          {
            "contractAddress": "<eternum-building_systems>",
            "entrypoint": "create",
            "calldata": [
              123,
              [1],
              1,
              3
            ]
          }
        </JSON>
      </EXAMPLE>
    </CREATE_BUILDING>
  </FUNCTIONS>
</PROVIDER_GUIDE>
`;
