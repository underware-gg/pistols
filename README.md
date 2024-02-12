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
    ~?YYYJ?7!^        A game of honour, chance and betrayal. Defend thine honour, scound! By Loot Underworld.               
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
* Amaro — Art, Design & Animations
* Mononoke — Logo & Art

## Assets

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

# other stuff you might need
cargo install toml-cli
brew install protobuf
```

Install the [Cairo 1.0](https://marketplace.visualstudio.com/items?itemName=starkware.cairo1) extension for Visual Studio Code


### Install Dojo 

> [Dojo Book](https://book.dojoengine.org/getting-started/quick-start.html)

Using Dojo 0.4.3

```console
curl -L https://install.dojoengine.org | bash
# open new terminal to update PATH
dojoup -v 0.4.3

# test dojo
cd dojo
sozo build
sozo test

# install packages
cd ../client
npm install
```


## Launch Dojo

#### Terminal 1: Katana (local node)

```console
cd dojo
katana --disable-fee --invoke-max-steps 10000000

# or just...
cd dojo
./run_katana
```

#### Terminal 2: Torii (indexer)

Uncomment the `world_address` parameter in `dojo/Scarb.toml` then:

```console
cd dojo
torii --world 0x2d6bcc12cbb460243b73a4c937faf00ad2d071d899f40dfc9182843712f9c77

# or just...
cd dojo
./run_torii
```

#### Terminal 3: Client

```console
cd client
npm install && npm dev

# or just...
cd dojo
./run_client
```

#### Terminal 4: Sozo commands

```console
# build world and systems
cd dojo
sozo build

# migrate to local Katana
cd dojo
./migrate
```


#### Open the game on a browser

* [http://localhost:3000/](http://localhost:3000/)


