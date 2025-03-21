# Pistols at Dawn

> Formerly known as **Pistols at 10 Blocks**

A fully on-chain game, made with love, by [Underware](https://underware.gg/), with [Dojo](https://www.dojoengine.org/), for [Realms](https://realms.world/), on [Starknet](https://www.starknet.io/).

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

Pistols at Dawn is an onchain game, in which you face off against another Lord in a pistol duel to defend your honour.

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

* Recipromancer — Lead, Renaissance Chaos Mode - [@recipromancer](https://x.com/recipromancer)
* Mataleone — Engineering - [@matalecode](https://x.com/matalecode)
* FortunaRegem - Engineering, Frontend, UI & Animations - [@FortunaRegem](https://x.com/FortunaRegem)
* Amaro — Art, Design, UI & Animations - [@AmaroKoberle](https://x.com/AmaroKoberle)
* Jubilee - R&D, Technical 3D systems

### Contributors

* Voltrevo — Engineering, Hidden information mechanism
* Mononoke — Logo & Art


## Contents

* `/client`: Main game web client (typescript, Vite)
* `/dojo`: Dojo contracts (cairo)
* `/sdk`: Pistols at Dawm SDK (typescript)
* `/dreams`: [Daydreams](https://www.dreams.fun/) AI agents (typescript)
* `/gamejam`: Original [Dojo Game Jam #3](https://twitter.com/ohayo_dojo/status/1747626446720258059) contents 
* `/assets`: Assorted test assets

### Assets

* biodecay-song6.mp3 - Original music by Recipromancer
* sfx/pistol-shot.mp3 — https://freesound.org/people/nioczkus/sounds/395789/
* sfx/grunt-man.mp3 — https://freesound.org/people/MrFossy/sounds/547198/
* sfx/grunt-female.mp3 — https://freesound.org/people/SkyRaeVoicing/sounds/368843/
* sfx/body-fall.mp3 — https://freesound.org/people/leonelmail/sounds/504626/


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

# Install starkli
# https://github.com/xJonathanLEI/starkli
curl https://get.starkli.sh | sh
starkliup

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# other stuff you will need
pnpm install -g turbo
brew install jq
brew install protobuf
cargo install toml-cli
```

Install the [Cairo 1.0](https://marketplace.visualstudio.com/items?itemName=starkware.cairo1) extension for Visual Studio Code / Cursor


### Install Dojo 

> [Dojo Book](https://book.dojoengine.org/getting-started)

Currenty using Dojo version `v1.3.1`

```sh
curl -L https://install.dojoengine.org | bash
# open new terminal to update PATH
dojoup -v v1.3.1

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
katana --disable-fee --chain-id KATANA_LOCAL --invoke-max-steps 10000000 --allowed-origins "*"

# or preferably...
cd dojo
./run_katana
```

#### Terminal 2: Torii (indexer)

Uncomment the `world_address` parameter in `dojo/Scarb.toml` then:

```sh
cd dojo
torii --allowed-origins "*" --index-pending --world 0xbee2bb53422762f6c51fb478a8a5da41a64ad678860d02800e0dbdac23dc36

# or preferably...
cd dojo
./run_torii dev
```

#### Terminal 3: Sozo commands / migration

Migrating to localhost:

```sh
# build world and systems
cd dojo
sozo clean
sozo build

# migrate to local Katana
./migrate dev

# migrate other profiles...
# ./migrate <PROFILE_NAME>
./migrate slot
```

For Starknet chains, create env files for `SN_SEPOLIA` (`.env.sepolia`) and/or `SN_MAIN` (`.env.mainnet`)

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

Configure default [NetworkId](/sdk/src/dojo/setup/networks.ts) in your `.env` file:

```sh
VITE_DEBUG=0
VITE_NETWORK_ID=KATANA_LOCAL
#VITE_NETWORK_ID=STAGING
#VITE_NETWORK_ID=SEPOLIA
#VITE_NETWORK_ID=MAINNET
```

Start the client

```sh
# http server
# http://localhost:5173
cd pistols
turbo dev

# https server (required for Catridge Controller)
# https://localhost:5173
cd pistols
turbo devs
```

Open [http://localhost:5173](http://localhost:5173) or [https://localhost:5173](https://localhost:5173)

