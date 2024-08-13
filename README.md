# Pistols at 10 Blocks

A fully on-chain game, made with love, by Loot Underworld, with Dojo, for Realms, on Starknet.

Winner of the [Dojo Game Jam #3](https://twitter.com/ohayo_dojo/status/1747626446720258059)

```
                                          ~~^             ^J~                                                           
                                         ~5G5!           75~                                                            
                                       .~PBG~        ^75P7                                                              
                                      ^?5BY~~^     YP5J~                                                                
                                    ^!J5GGPJ7      ?P^,                                                                 
                           ... ^!?Y5P7GB&&@&5J???7?YPY5YYJ?~7!!~~~~!!~^7~~~~~~!~~~~~^^~^^^^^^^^^^~^^[!]vvvvv!::)      
                      .. ^~~JPB###&#B?^PB#55Y?7YG5?J7?BG5YJ?7777!!!7777?777?7?????JJJJYJJYJJJJYYYYJY[!]~~~~~!::)      
                  .. ~7JPBBBB5?~?YJ~??~YGP7!???YGPJ5BGPBGPP555P5YYG###GGGPPGPPPPPPPPPPGGPGGPGGBB#B##[!]^^^^^!::)      
               . ^75B##BG55J~::~Y7~!75BG5~^::^~~!!7?J?J55BPPPB#BPG&&&#########BB#BBBBBBBBBGPGBBBBBBB[!]               
              ^7P##BGGGP5YY^:.:^~?J??YPGJ?7???YYY555GGBBGBBB#&&#B#/~~~~~~~~^^^^^^^^^^^^^^^~~~~^^^^^^^^^^^^^^)         
          .:!5###GPP5J?777JY55PGB########&##########BGP55YJ?7/~^^^                                                      
         ^JB##GP5Y?77J5GBB#####BP5GBJ!!!77JJ!~^^^^^^        /                                                           
       ~YB#GP55YY5GB##BPY7!~~?Y   ^!      7~                                                                            
     .^Y##BG5555B&&#P?^:      :?~  ^^.   ^!!                                                                             
    ?B#BGP5P##&@&Y^            ^~~~~~!fDm                                                                               
   P#BBG5YP###&B~..                                                                                                     
  B#PBG5J5B&#&#!.         ____  _      __        __              __     _______     ____  __           __           
 J#5PGGY?YBB#@B^.        / __ \(_)____/ /_____  / /____   ____ _/ /_   <  / __ \   / __ )/ /___  _____/ /_______    
 YGGGGPJ?JGBB@#7.       / /_/ / / ___/ __/ __ \/ / ___/  / __ `/ __/   / / / / /  / __  / / __ \/ ___/ //_/ ___/    
 JP5?~^...^?JG&#^      / ____/ (__  ) /_/ /_/ / (__  )  / /_/ / /_    / / /_/ /  / /_/ / / /_/ / /__/ ,< (__  )     
 ~PY!::. .:7?YBB^     /_/   /_/____/\__/\____/_/____/   \__,_/\__/   /_/\____/  /_____/_/\____/\___/_/|_/____/      
  ~55J!~:^7?5PY^                                                                                                        
    ~?YYYJ?7!^        A game of honour, chance and betrayal. Defend thine honour, scound! By Underware.gg.               
       ^^^                                                                                                                       
```

## Overview
Thou art an offence to all that is decent, dog. I challenge you... to a duel!

Pistols at 10 Blocks is an onchain game, in which you face off against another Lord in a pistol duel to defend your honour.

> **A righteous smoulder in your eye and your smoothbore, flintlock pistol held lightly at your side, cocked and ready, you stand
> in the misty morning field. Holding back the gorge rising in your throat, you shake that mongrel's hand and turn, taking your
> first step. Your feet crunch in the crisp morning grass, one step, two steps, three. You hear the snap of a cloak, the gasp
> of your second, and a sharp, booming crack, then your left arm explodes into pain. That traitorous scum shot early! Gritting your
> teeth against the pain, and without turning around, you keep stepping foward. Four, Five, Six, Seven, Eight, Nine... Ten. You
> turn around, slowly, a dark menace in your shoulder, and raise your pistol. The cur stands there, a defiant sneer upon his face,
> and throws his still smoking pistol to the ground. You take a deep breath, and whisper "May you find honour in death, you wretch!"**
> 
> **Blood sprays in a beautiful arc from his head, and he drops like a felled log. Silence, interrupteed only by the spattering of
> blood from your arm, into the morning grass.**

## Team

* Recipromancer — Lead, Renaissance Chaos Mode
* Mataleone — Engineering
* Voltrevo — Engineering, Hidden information mechanism
* FortunaRegem - Engineering, Frontend, UI & Animations
* Amaro — Art, Design, UI & Animations
* Mononoke — Logo & Art
* Jubiliee - Technical 3D systems

## Assets

* biodecay-song6.mp3 - Original music by Recipromancer
* sfx/pistol-shot.mp3 — https://freesound.org/people/nioczkus/sounds/395789/
* sfx/grunt-man.mp3 — https://freesound.org/people/MrFossy/sounds/547198/
* sfx/grunt-female.mp3 — https://freesound.org/people/SkyRaeVoicing/sounds/368843/
* sfx/body-fall.mp3 — https://freesound.org/people/leonelmail/sounds/504626/


## Gameplay Logic 

### Pistols Round

In the Pistols round, each player has a chance to **injure** (1 dmg) or **wound** (2 dmg) and a chance to **execute**, each expressed as percentages, calculated based on the number of steps taken.

2) Hit chance is calculated, affected by hit penalties. The highest chance at 1 pace, the lowest chance at 10 paces, interpolated in between.

https://github.com/funDAOmental/pistols/blob/0d064ac90f502f348b6f14624f962661140b67aa/dojo/src/types/constants.cairo#L15-L17

1) Execute chances is calculated, not affected by hit penalties. The highest chance at 10 paces, the lowest chance at 1 pace, interpolated in between.

https://github.com/funDAOmental/pistols/blob/0d064ac90f502f348b6f14624f962661140b67aa/dojo/src/types/constants.cairo#L19-L21

### Blades Round

In the Blades round, each player has two strikes, each with a chance to **injure** or **wound**, each expressed as percentages.

1) `Heavy` blades use both strikes, doing nothing on the first strike and 2 dmg on the second strike. They have a chance to **execute**, which occurs before other strikes.

If no execution occurs...

2) `Light` blades do 1 dmg, `Block` prevents 1 damage, and each use one strike. They have a chance to **crit**, doubling their effect.

3) All other strikes happen at the same time, and `Block` only prevents damage against strikes that happen at the same time as it.



### Bonus and Damage penalty

Honourable duelists, with Honour > 9.0, get a bonus to crit or execution on every Hit

Injured duelists suffer a penalty to Hit


## Development notes

### Environment Setup

> [Dojo Book](https://book.dojoengine.org/getting-started/setup.html)

Install Rust + Cargo + others

```
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# open new terminal
rustup override set stable
rustup update

# Install Cargo
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# other stuff you will need
brew install jq
brew install protobuf
cargo install toml-cli
```

Install the [Cairo 1.0](https://marketplace.visualstudio.com/items?itemName=starkware.cairo1) extension for Visual Studio Code


### Install Dojo 

> [Dojo Book](https://book.dojoengine.org/getting-started)

Currenty using Dojo version `v1.0.0-alpha.5`

```sh
curl -L https://install.dojoengine.org | bash
# open new terminal to update PATH
dojoup -v v1.0.0-alpha.5

# test dojo
cd dojo
sozo build
sozo test

# install packages
cd ../client
pnpm install
```


## Launch Dojo

#### Terminal 1: Katana (local node)

```sh
cd dojo
katana --disable-fee --chain-id KATANA_LOCAL --invoke-max-steps 10000000 --allowed-origins "*" --accounts 10

# or preferably...
cd dojo
./run_katana
```

#### Terminal 2: Torii (indexer)

Uncomment the `world_address` parameter in `dojo/Scarb.toml` then:

```sh
cd dojo
torii --allowed-origins "*" --index-pending --world 0x360fd2af2f118387ae282b66bfdbb6d4bb7e45a7213e101e5b8aa3471939677

# or preferably...
cd dojo
./run_torii
```

#### Terminal 3: Sozo commands / migration

Migrating to localhost:

```sh
# build world and systems
cd dojo
sozo clean
sozo build

# migrate to local Katana
./migrate

# migrate other profiles
./migrate <PROFILE_NAME>
# example:
./migrate slot
```

For Starknet chains, create env files for `SN_SEPOLIA` (`.env.sepolia`) and/or `SN_MAINNET` (`.env.mainnet`)

```sh
export STARKNET_RPC_URL=https://sepolia.your-favorite-rpc-provider.com/xxx/
export DOJO_ACCOUNT_ADDRESS=0x1234
export DOJO_PRIVATE_KEY=0x1234
```

then migrate...

```sh
# enable env
source .env.sepolia

# migrate to local Katana
./migrate sepolia

# clear env if you want to work on another profile
source .env.clear
```


#### Terminal 4: Client

Install dependencies

```sh
cd client
pnpm i
```

Configure default chain id in a `.env` file:

```sh
NEXT_PUBLIC_DEBUG=0
NEXT_PUBLIC_CHAIN_ID=KATANA_LOCAL
#NEXT_PUBLIC_CHAIN_ID=SN_SEPOLIA
#NEXT_PUBLIC_CHAIN_ID=WP_PISTOLS_SLOT
```

Start the client

```sh
# http server
# http://localhost:3000
pnpm run dev

# https server (required for Catridge Controller)
# https://localhost:3000
pnpm run devs
```

Open [http://localhost:3000](http://localhost:3000) or [https://localhost:3000](https://localhost:3000)

