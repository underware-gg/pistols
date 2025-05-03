
//
// REF
//
// dope wars
// https://github.com/cartridge-gg/dopewars/blob/6f6599fa65ad8b2f5ebd12fcf333f8f381edf396/src/systems/ryo.cairo#L129
// - trophies:
// https://github.com/cartridge-gg/dopewars/blob/6f6599fa65ad8b2f5ebd12fcf333f8f381edf396/src/elements/trophies/types.cairo
// https://github.com/cartridge-gg/dopewars/blob/6f6599fa65ad8b2f5ebd12fcf333f8f381edf396/src/elements/trophies/hustler.cairo
// - tasks:
// https://github.com/cartridge-gg/dopewars/blob/6f6599fa65ad8b2f5ebd12fcf333f8f381edf396/src/elements/quests/types.cairo#L74-L78
// https://github.com/cartridge-gg/dopewars/blob/6f6599fa65ad8b2f5ebd12fcf333f8f381edf396/src/elements/quests/hustler.cairo
// - progress:
// https://github.com/cartridge-gg/dopewars/blob/6f6599fa65ad8b2f5ebd12fcf333f8f381edf396/src/systems/helpers/traveling.cairo#L180-L214
//
// eternum
// https://github.com/BibliothecaDAO/eternum/blob/d2282fe3f4d34685639f004d50ddd35713c3aeba/contracts/src/systems/config/contracts.cairo#L270-L290
// https://github.com/BibliothecaDAO/eternum/blob/d2282fe3f4d34685639f004d50ddd35713c3aeba/contracts/src/utils/trophies/index.cairo
// https://github.com/BibliothecaDAO/eternum/blob/d2282fe3f4d34685639f004d50ddd35713c3aeba/contracts/src/utils/trophies/breeder.cairo
// https://github.com/BibliothecaDAO/eternum/blob/d2282fe3f4d34685639f004d50ddd35713c3aeba/contracts/src/utils/tasks/index.cairo
// https://github.com/BibliothecaDAO/eternum/blob/d2282fe3f4d34685639f004d50ddd35713c3aeba/contracts/src/utils/tasks/breeder.cairo
//

#[derive(Copy, Drop, PartialEq)]
pub enum Trophy {
    None,               // 0
    BeginnersLuck,      // 1
    FirstBlood,         // 2
    PerfectDodge,       // 3
    DodgeAndKill,       // 4
    ShotInTheBack,      // 5
    ShotAtTheBack,      // 6
    DuelCollector,      // 7
    VillainousScum,     // 8
    HonourableLord,     // 9
    Blindfold,          // 10
    BloodBath,          // 11
    BladesClash,        // 12
    DoubleBarrel,       // 13
    TrippleBarrel,      // 14
    QuadrupleBarrel,    // 15
    QuintupleBarrel,    // 16
    VillainousDeath,    // 17
    TricksterDeath,     // 18
    HonourableDeath,    // 19
    PocketPistol,       // 20
    Behead,             // 21
    Grapple,            // 22
    Seppuku,            // 23
    DoubleSeppuku,      // 24
    GoneBananas,        // 25
    BeatTheOdds,        // 26
    WastedAmmo,         // 27
    DoThatThing,        // 28
    SeasonCollector,    // 29
}

pub mod TROPHY_ID {
    // trophy count
    pub const COUNT: u8 = 29;
    // identifiers
    pub const None: felt252 = '';
    pub const BeginnersLuck: felt252 = 'BeginnersLuck';
    pub const FirstBlood: felt252 = 'FirstBlood';
    pub const PerfectDodge: felt252 = 'PerfectDodge';
    pub const DodgeAndKill: felt252 = 'DodgeAndKill';
    pub const ShotInTheBack: felt252 = 'ShotInTheBack';
    pub const ShotAtTheBack: felt252 = 'ShotAtTheBack';
    pub const DuelCollector: felt252 = 'DuelCollector';
    pub const VillainousScum: felt252 = 'VillainousScum';
    pub const HonourableLord: felt252 = 'HonourableLord';
    pub const Blindfold: felt252 = 'Blindfold';
    pub const BloodBath: felt252 = 'BloodBath';
    pub const BladesClash: felt252 = 'BladesClash';
    pub const DoubleBarrel: felt252 = 'DoubleBarrel';
    pub const TrippleBarrel: felt252 = 'TrippleBarrel';
    pub const QuadrupleBarrel: felt252 = 'QuadrupleBarrel';
    pub const QuintupleBarrel: felt252 = 'QuintupleBarrel';
    pub const VillainousDeath: felt252 = 'VillainousDeath';
    pub const TricksterDeath: felt252 = 'TricksterDeath';
    pub const HonourableDeath: felt252 = 'HonourableDeath';
    pub const PocketPistol: felt252 = 'PocketPistol';
    pub const Behead: felt252 = 'Behead';
    pub const Grapple: felt252 = 'Grapple';
    pub const Seppuku: felt252 = 'Seppuku';
    pub const DoubleSeppuku: felt252 = 'DoubleSeppuku';
    pub const GoneBananas: felt252 = 'GoneBananas';
    pub const BeatTheOdds: felt252 = 'BeatTheOdds';
    pub const WastedAmmo: felt252 = 'WastedAmmo';
    pub const DoThatThing: felt252 = 'DoThatThing';
    pub const SeasonCollector: felt252 = 'SeasonCollector';
}

pub mod TROPHY_GROUP {
    pub const Player: felt252 = 'Player';
    pub const Honour: felt252 = 'Honour';
    pub const Duelist: felt252 = 'Duelist';
    pub const Tactics: felt252 = 'Tactics';
}



//------------------------------------------
// Traits
//
use starknet::{ContractAddress};
use dojo::world::{WorldStorage};
use achievement::types::task::{
    Task as ArcadeTask,
    TaskTrait as ArcadeTaskTrait,
};
use achievement::store::{
    Store as ArcadeStore,
    StoreTrait as ArcadeStoreTrait
};
use pistols::utils::short_string::{ShortString};


#[generate_trait]
pub impl TrophyImpl of TrophyTrait {
    fn identifier(self: @Trophy) -> felt252 {
        match self {
            Trophy::None                => TROPHY_ID::None,
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => TROPHY_ID::BeginnersLuck,
            Trophy::FirstBlood          => TROPHY_ID::FirstBlood,
            Trophy::PerfectDodge        => TROPHY_ID::PerfectDodge,
            Trophy::DodgeAndKill        => TROPHY_ID::DodgeAndKill,
            Trophy::ShotInTheBack       => TROPHY_ID::ShotInTheBack,
            Trophy::ShotAtTheBack       => TROPHY_ID::ShotAtTheBack,
            Trophy::DuelCollector       => TROPHY_ID::DuelCollector,
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => TROPHY_ID::VillainousScum,
            Trophy::HonourableLord      => TROPHY_ID::HonourableLord,
            Trophy::Blindfold           => TROPHY_ID::Blindfold,
            Trophy::BloodBath           => TROPHY_ID::BloodBath,
            Trophy::BladesClash         => TROPHY_ID::BladesClash,
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => TROPHY_ID::DoubleBarrel,
            Trophy::TrippleBarrel       => TROPHY_ID::TrippleBarrel,
            Trophy::QuadrupleBarrel     => TROPHY_ID::QuadrupleBarrel,
            Trophy::QuintupleBarrel     => TROPHY_ID::QuintupleBarrel,
            Trophy::VillainousDeath     => TROPHY_ID::VillainousDeath,
            Trophy::TricksterDeath      => TROPHY_ID::TricksterDeath,
            Trophy::HonourableDeath     => TROPHY_ID::HonourableDeath,
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => TROPHY_ID::PocketPistol,
            Trophy::Behead              => TROPHY_ID::Behead,
            Trophy::Grapple             => TROPHY_ID::Grapple,
            Trophy::Seppuku             => TROPHY_ID::Seppuku,
            Trophy::DoubleSeppuku       => TROPHY_ID::DoubleSeppuku,
            Trophy::GoneBananas         => TROPHY_ID::GoneBananas,
            Trophy::BeatTheOdds         => TROPHY_ID::BeatTheOdds,
            Trophy::WastedAmmo          => TROPHY_ID::WastedAmmo,
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => TROPHY_ID::DoThatThing,
            Trophy::SeasonCollector     => TROPHY_ID::SeasonCollector,
        }
    }

    // The achievement group, it should be used to group achievements together
    fn group(self: @Trophy) -> felt252 {
        match self {
            Trophy::None                => TROPHY_GROUP::Player,
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => TROPHY_GROUP::Player,
            Trophy::FirstBlood          => TROPHY_GROUP::Player,
            Trophy::PerfectDodge        => TROPHY_GROUP::Player,
            Trophy::DodgeAndKill        => TROPHY_GROUP::Player,
            Trophy::ShotInTheBack       => TROPHY_GROUP::Player,
            Trophy::ShotAtTheBack       => TROPHY_GROUP::Player,
            Trophy::DuelCollector       => TROPHY_GROUP::Player,
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => TROPHY_GROUP::Honour,
            Trophy::HonourableLord      => TROPHY_GROUP::Honour,
            Trophy::Blindfold           => TROPHY_GROUP::Honour,
            Trophy::BloodBath           => TROPHY_GROUP::Honour,
            Trophy::BladesClash         => TROPHY_GROUP::Honour,
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => TROPHY_GROUP::Duelist,
            Trophy::TrippleBarrel       => TROPHY_GROUP::Duelist,
            Trophy::QuadrupleBarrel     => TROPHY_GROUP::Duelist,
            Trophy::QuintupleBarrel     => TROPHY_GROUP::Duelist,
            Trophy::VillainousDeath     => TROPHY_GROUP::Duelist,
            Trophy::TricksterDeath      => TROPHY_GROUP::Duelist,
            Trophy::HonourableDeath     => TROPHY_GROUP::Duelist,
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => TROPHY_GROUP::Tactics,
            Trophy::Behead              => TROPHY_GROUP::Tactics,
            Trophy::Grapple             => TROPHY_GROUP::Tactics,
            Trophy::Seppuku             => TROPHY_GROUP::Tactics,
            Trophy::DoubleSeppuku       => TROPHY_GROUP::Tactics,
            Trophy::GoneBananas         => TROPHY_GROUP::Tactics,
            Trophy::BeatTheOdds         => TROPHY_GROUP::Tactics,
            Trophy::WastedAmmo          => TROPHY_GROUP::Tactics,
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => TROPHY_GROUP::Player,
            Trophy::SeasonCollector     => TROPHY_GROUP::Player,
        }
    }

    // index inside the group
    fn index(self: @Trophy) -> u8 {
        match self {
            Trophy::None                => 0,
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => 0,
            Trophy::FirstBlood          => 1,
            Trophy::PerfectDodge        => 2,
            Trophy::DodgeAndKill        => 3,
            Trophy::ShotInTheBack       => 4,
            Trophy::ShotAtTheBack       => 5,
            Trophy::DuelCollector       => 6,
            Trophy::DoThatThing         => 7,
            Trophy::SeasonCollector     => 8,
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => 0,
            Trophy::HonourableLord      => 1,
            Trophy::Blindfold           => 2,
            Trophy::BloodBath           => 3,
            Trophy::BladesClash         => 4,
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => 0,
            Trophy::TrippleBarrel       => 1,
            Trophy::QuadrupleBarrel     => 2,
            Trophy::QuintupleBarrel     => 3,
            Trophy::VillainousDeath     => 4,
            Trophy::TricksterDeath      => 5,
            Trophy::HonourableDeath     => 6,
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => 0,
            Trophy::Behead              => 1,
            Trophy::Grapple             => 2,
            Trophy::Seppuku             => 3,
            Trophy::DoubleSeppuku       => 4,
            Trophy::GoneBananas         => 5,
            Trophy::BeatTheOdds         => 6,
            Trophy::WastedAmmo          => 7,
        }
    }

    fn title(self: @Trophy) -> felt252 {
        match self {
            Trophy::None                => 'None',
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => 'Beginner\'s Luck',
            Trophy::FirstBlood          => 'First Blood',
            Trophy::PerfectDodge        => 'Perfect Dodge',
            Trophy::DodgeAndKill        => 'Dodge and Kill',
            Trophy::ShotInTheBack       => 'Shot in the Back',
            Trophy::ShotAtTheBack       => 'ShotAtTheBack',
            Trophy::DuelCollector       => 'Duel Collector',
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => 'Villainous Scum',
            Trophy::HonourableLord      => 'Honourable Lord',
            Trophy::Blindfold           => 'Blindfold',
            Trophy::BloodBath           => 'Blood Bath',
            Trophy::BladesClash         => 'Blades Clash',
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => 'Double Barrel',
            Trophy::TrippleBarrel       => 'Tripple Barrel',
            Trophy::QuadrupleBarrel     => 'Quadruple Barrel',
            Trophy::QuintupleBarrel     => 'Quintuple Barrel',
            Trophy::VillainousDeath     => 'Villainous Death',
            Trophy::TricksterDeath      => 'Trickster Death',
            Trophy::HonourableDeath     => 'Honourable Death',
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => 'Pocket Pistol',
            Trophy::Behead              => 'Behead',
            Trophy::Grapple             => 'Grapple',
            Trophy::Seppuku             => 'Seppuku',
            Trophy::DoubleSeppuku       => 'Double Seppuku',
            Trophy::GoneBananas         => 'Gone Bananas',
            Trophy::BeatTheOdds         => 'Beat the Odds',
            Trophy::WastedAmmo          => 'Wasted Ammo',
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => 'Do That Thing',
            Trophy::SeasonCollector     => 'Season Collector',
        }
    }

    fn description(self: @Trophy) -> ByteArray {
        match self {
            Trophy::None                => "Nothing to do here",
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => "You only had one chance!",
            Trophy::FirstBlood          => "That's how it feels!",
            Trophy::PerfectDodge        => "I got eyes on my back!",
            Trophy::DodgeAndKill        => "Satisfaction guaranteed",
            Trophy::ShotInTheBack       => "The utmost defeat!",
            Trophy::ShotAtTheBack       => "The utmost kill!",
            Trophy::DuelCollector       => "Tidying up the fields",
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => "You're such a Villainous Scum",
            Trophy::HonourableLord      => "You're such an Honourable Lord",
            Trophy::Blindfold           => "Next time, keep your eyes open!",
            Trophy::BloodBath           => "What a bloody mess!",
            Trophy::BladesClash         => "A deadly combination",
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => "Getting a grip!",
            Trophy::TrippleBarrel       => "My gun is smoking!",
            Trophy::QuadrupleBarrel     => "No one can stop me!",
            Trophy::QuintupleBarrel     => "That ain't luck no more!",
            Trophy::VillainousDeath     => "Died laughing!",
            Trophy::TricksterDeath      => "Turned to smoke!",
            Trophy::HonourableDeath     => "Give me my tombstone.",
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => "Take that!",
            Trophy::Behead              => "I'll put that on my wall",
            Trophy::Grapple             => "Come here baby!",
            Trophy::Seppuku             => "I prefer to die than lose to you!",
            Trophy::DoubleSeppuku       => "Who's the Romeo here?",
            Trophy::GoneBananas         => "Bananas ain't just for art",
            Trophy::BeatTheOdds         => "By the hand of the gods",
            Trophy::WastedAmmo          => "You deserve a prize for that",
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => "You did that thing.",
            Trophy::SeasonCollector     => "Someone has to clean up the mess",
        }
    }

    fn points(self: @Trophy) -> u16 {
        match self {
            Trophy::None                => 0,
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => 100,
            Trophy::FirstBlood          => 50,
            Trophy::PerfectDodge        => 100,
            Trophy::DodgeAndKill        => 100,
            Trophy::ShotInTheBack       => 100,
            Trophy::ShotAtTheBack       => 100,
            Trophy::DuelCollector       => 50,
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => 100,
            Trophy::HonourableLord      => 100,
            Trophy::Blindfold           => 50,
            Trophy::BloodBath           => 100,
            Trophy::BladesClash         => 100,
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => 60,
            Trophy::TrippleBarrel       => 100,
            Trophy::QuadrupleBarrel     => 100,
            Trophy::QuintupleBarrel     => 100,
            Trophy::VillainousDeath     => 80,
            Trophy::TricksterDeath      => 80,
            Trophy::HonourableDeath     => 80,
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => 60,
            Trophy::Behead              => 60,
            Trophy::Grapple             => 60,
            Trophy::Seppuku             => 60,
            Trophy::DoubleSeppuku       => 100,
            Trophy::GoneBananas         => 60,
            Trophy::BeatTheOdds         => 100,
            Trophy::WastedAmmo          => 100,
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => 100,
            Trophy::SeasonCollector     => 1,
        }
    }

    fn hidden(self: @Trophy) -> bool {
        match self {
            Trophy::BeginnersLuck => true,
            _ => false,
        }
    }

    #[inline(always)]
    fn start(self: @Trophy) -> u64 {
        (0)
    }

    #[inline(always)]
    fn end(self: @Trophy) -> u64 {
        (0)
    }

    // from: https://fontawesome.com/icons
    fn icon(self: @Trophy) -> felt252 {
        match self {
            Trophy::None                => 'fa-circle-question',
            Trophy::BeginnersLuck       => 'fa-clover',
            Trophy::FirstBlood          => 'fa-droplet',
            Trophy::PerfectDodge        => 'fa-person-falling',
            Trophy::DodgeAndKill        => 'fa-person-from-portal',
            Trophy::ShotInTheBack       => 'fa-bullseye-arrow',
            Trophy::ShotAtTheBack       => 'fa-bullseye-pointer',
            Trophy::DuelCollector       => 'fa-business-time',
            Trophy::VillainousScum      => 'fa-user-ninja',
            Trophy::HonourableLord      => 'fa-user-crown',
            Trophy::Blindfold           => 'fa-person-walking-with-cane',
            Trophy::BloodBath           => 'fa-skull',
            Trophy::BladesClash         => 'fa-burst',
            Trophy::DoubleBarrel        => 'fa-tally-2',
            Trophy::TrippleBarrel       => 'fa-tally-3',
            Trophy::QuadrupleBarrel     => 'fa-tally-4',
            Trophy::QuintupleBarrel     => 'fa-tally',
            Trophy::VillainousDeath     => 'fa-mask',
            Trophy::TricksterDeath      => 'fa-card-spade',
            Trophy::HonourableDeath     => 'fa-crown',
            Trophy::PocketPistol        => 'fa-gun',
            Trophy::Behead              => 'fa-sickle',
            Trophy::Grapple             => 'fa-pickaxe',
            Trophy::Seppuku             => 'fa-person-praying',
            Trophy::DoubleSeppuku       => 'fa-tombstone-blank',
            Trophy::GoneBananas         => 'fa-banana',
            Trophy::BeatTheOdds         => 'fa-dice-six',
            Trophy::WastedAmmo          => 'fa-dice-one',
            Trophy::DoThatThing         => 'fa-brackets-round',
            Trophy::SeasonCollector     => 'fa-briefcase-arrow-right',
        }
    }

    fn task_count(self: @Trophy) -> u32 {
        match self {
            Trophy::None                => 0,
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => 1,
            Trophy::FirstBlood          => 3,
            Trophy::PerfectDodge        => 3,
            Trophy::DodgeAndKill        => 3,
            Trophy::ShotInTheBack       => 3,
            Trophy::ShotAtTheBack       => 3,
            Trophy::DuelCollector       => 5,
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => 3,
            Trophy::HonourableLord      => 3,
            Trophy::Blindfold           => 1,
            Trophy::BloodBath           => 1,
            Trophy::BladesClash         => 1,
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => 1,
            Trophy::TrippleBarrel       => 1,
            Trophy::QuadrupleBarrel     => 1,
            Trophy::QuintupleBarrel     => 1,
            Trophy::VillainousDeath     => 1,
            Trophy::TricksterDeath      => 1,
            Trophy::HonourableDeath     => 1,
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => 3,
            Trophy::Behead              => 3,
            Trophy::Grapple             => 3,
            Trophy::Seppuku             => 1,
            Trophy::DoubleSeppuku       => 1,
            Trophy::GoneBananas         => 1,
            Trophy::BeatTheOdds         => 1,
            Trophy::WastedAmmo          => 1,
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => 1,
            Trophy::SeasonCollector     => 1,
        }
    }

    fn task_description(self: @Trophy) -> ByteArray {
        match self {
            Trophy::None                => "Huhhh...",
            // TROPHY_GROUP::Player
            Trophy::BeginnersLuck       => "Win your very first Duel",
            Trophy::FirstBlood          => "Win a Duel",
            Trophy::PerfectDodge        => "Dodge a bullet",
            Trophy::DodgeAndKill        => "Dodge, shoot and kill your opponent",
            Trophy::ShotInTheBack       => "Get a shot in the back!",
            Trophy::ShotAtTheBack       => "Shoot your opponent at the back!",
            Trophy::DuelCollector       => "Collect an expired duel (from another player)",
            // TROPHY_GROUP::Honour
            Trophy::VillainousScum      => "Win a duel at 1 pace",
            Trophy::HonourableLord      => "Win a duel at 10 paces",
            Trophy::Blindfold           => "Missed at same pace",
            Trophy::BloodBath           => "Kill each other",
            Trophy::BladesClash         => "Same blades",
            // TROPHY_GROUP::Duelist
            Trophy::DoubleBarrel        => "One of your duelists won 2 duels",
            Trophy::TrippleBarrel       => "One of your duelists won 3 duels",
            Trophy::QuadrupleBarrel     => "One of your duelists won 4 duels",
            Trophy::QuintupleBarrel     => "One of your duelists won 5 duels",
            Trophy::VillainousDeath     => "One of your duelists died as a Villain",
            Trophy::TricksterDeath      => "One of your duelists died as a Trickster",
            Trophy::HonourableDeath     => "One of your duelists died as a Lord",
            // TROPHY_GROUP::Tactics
            Trophy::PocketPistol        => "Win using the Pocket Pistol card",
            Trophy::Behead              => "Win using the Behead card",
            Trophy::Grapple             => "Win using the Grapple card",
            Trophy::Seppuku             => "Commit seppuku",
            Trophy::DoubleSeppuku       => "Commit seppuku with your opponent",
            Trophy::GoneBananas         => "Win using the Bananas card",
            Trophy::BeatTheOdds         => "Hit a shot with 10% chances",
            Trophy::WastedAmmo          => "Miss a shot with 90% chances",
            // TROPHY_GROUP::Player
            Trophy::DoThatThing         => "You have to do that thing",
            Trophy::SeasonCollector     => "Collect the spoils of the season",
        }
    }

    fn tasks(self: @Trophy) -> Span<ArcadeTask> {
        let task: ArcadeTask = ArcadeTaskTrait::new(
            self.identifier(),
            self.task_count(),
            self.task_description(),
        );
        ([task].span())
    }

    #[inline(always)]
    fn data(self: @Trophy) -> ByteArray {
        ("")
    }

    // send a progress event to the arcade store
    // https://github.com/cartridge-gg/arcade/blob/main/packages/achievement/src/components/achievable.cairo#L99-L112
    // https://github.com/cartridge-gg/arcade/blob/main/packages/achievement/src/store.cairo#L59-L63
    fn progress(self: @Trophy, store: @ArcadeStore, player_address: @ContractAddress, count: u32) {
// println!("___progress: {} {}", self, self.identifier());
        (*store).progress(
            (*player_address).into(),
            self.identifier(),
            count,
            starknet::get_block_timestamp(),
        );
    }
}


//----------------------------
// Converters
//

pub impl IntoTrophyU8 of core::traits::Into<Trophy, u8> {
    fn into(self: Trophy) -> u8 {
        match self {
            Trophy::None                => 0,
            Trophy::BeginnersLuck       => 1,
            Trophy::FirstBlood          => 2,
            Trophy::PerfectDodge        => 3,
            Trophy::DodgeAndKill        => 4,
            Trophy::ShotInTheBack       => 5,
            Trophy::ShotAtTheBack       => 6,
            Trophy::DuelCollector       => 7,
            Trophy::VillainousScum      => 8,
            Trophy::HonourableLord      => 9,
            Trophy::Blindfold           => 10,
            Trophy::BloodBath           => 11,
            Trophy::BladesClash         => 12,
            Trophy::DoubleBarrel        => 13,
            Trophy::TrippleBarrel       => 14,
            Trophy::QuadrupleBarrel     => 15,
            Trophy::QuintupleBarrel     => 16,
            Trophy::VillainousDeath     => 17,
            Trophy::TricksterDeath      => 18,
            Trophy::HonourableDeath     => 19,
            Trophy::PocketPistol        => 20,
            Trophy::Behead              => 21,
            Trophy::Grapple             => 22,
            Trophy::Seppuku             => 23,
            Trophy::DoubleSeppuku       => 24,
            Trophy::GoneBananas         => 25,
            Trophy::BeatTheOdds         => 26,
            Trophy::WastedAmmo          => 27,
            Trophy::DoThatThing         => 28,
            Trophy::SeasonCollector     => 29,
        }
    }
}

pub impl IntoU8Trophy of core::traits::Into<u8, Trophy> {
    fn into(self: u8) -> Trophy {
        let card: felt252 = self.into();
        match card {
            0  => Trophy::None,
            1  => Trophy::BeginnersLuck,
            2  => Trophy::FirstBlood,
            3  => Trophy::PerfectDodge,
            4  => Trophy::DodgeAndKill,
            5  => Trophy::ShotInTheBack,
            6  => Trophy::ShotAtTheBack,
            7  => Trophy::DuelCollector,
            8  => Trophy::VillainousScum,
            9  => Trophy::HonourableLord,
            10 => Trophy::Blindfold,
            11 => Trophy::BloodBath,
            12 => Trophy::BladesClash,
            13 => Trophy::DoubleBarrel,
            14 => Trophy::TrippleBarrel,
            15 => Trophy::QuadrupleBarrel,
            16 => Trophy::QuintupleBarrel,
            17 => Trophy::VillainousDeath,
            18 => Trophy::TricksterDeath,
            19 => Trophy::HonourableDeath,
            20 => Trophy::PocketPistol,
            21 => Trophy::Behead,
            22 => Trophy::Grapple,
            23 => Trophy::Seppuku,
            24 => Trophy::DoubleSeppuku,
            25 => Trophy::GoneBananas,
            26 => Trophy::BeatTheOdds,
            27 => Trophy::WastedAmmo,
            28 => Trophy::DoThatThing,
            29 => Trophy::SeasonCollector,
            _  => Trophy::None,
        }
    }
}

// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl TrophyDisplay of core::fmt::Display<Trophy> {
    fn fmt(self: @Trophy, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = self.identifier().to_string();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl TrophyDebug of core::fmt::Debug<Trophy> {
    fn fmt(self: @Trophy, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = self.identifier().to_string();
        f.buffer.append(@result);
        Result::Ok(())
    }
}





//------------------------------------------
// Trophy distribution
//
use core::num::traits::Zero;
use pistols::models::{
    challenge::{
        Challenge, ChallengeTrait, Round,
        DuelistState, DuelistStateTrait,
    },
    duelist::{Totals, TotalsTrait},
};
use pistols::types::{
    duel_progress::{DuelProgress},
    rules::{RewardValues, DuelBonus, DuelistBonus},
    cards::hand::{
        DuelistHand,
        PacesCard,
        TacticsCard,
        BladesCard,
        FinalBlow,
    },
};

#[generate_trait]
pub impl TrophyProgressImpl of TrophyProgressTrait {
    // Duel has a winner
    fn duel_resolved(world: @WorldStorage, challenge: @Challenge, round: @Round, progress: @DuelProgress) -> DuelBonus {
        let store: @ArcadeStore = @ArcadeStoreTrait::new(*world);
        let (hand_winner, hand_loser): (@DuelistHand, @DuelistHand) =
            if (*challenge.winner == 1) {(progress.hand_a, progress.hand_b)}
            else {(progress.hand_b, progress.hand_a)};
        let mut last_pace: @PacesCard = @PacesCard::Paces10;
        let mut bonus_winner: DuelistBonus = Default::default();
        let mut bonus_loser: DuelistBonus = Default::default();
        match (round.final_blow) {
            FinalBlow::Paces(pace) => {
                last_pace = pace;
                if (*pace == PacesCard::Paces1) {
                    Trophy::VillainousScum.progress(store, @challenge.winner_address(), 1);
                } else if (*pace == PacesCard::Paces10) {
                    Trophy::HonourableLord.progress(store, @challenge.winner_address(), 1);
                }
                if (hand_winner.card_dodge < hand_winner.card_fire && hand_winner.card_dodge == hand_loser.card_fire) {
                    Trophy::DodgeAndKill.progress(store, @challenge.winner_address(), 1);
                }
                if (hand_winner.card_fire < hand_loser.card_fire) {
                    Trophy::ShotAtTheBack.progress(store, @challenge.winner_address(), 1);
                    Trophy::ShotInTheBack.progress(store, @challenge.loser_address(), 1);
                }
                bonus_winner.kill_pace = (*pace).into();
            },
            FinalBlow::Blades(blade) => {
                match (*blade) {
                    BladesCard::PocketPistol => {
                        Trophy::PocketPistol.progress(store, @challenge.winner_address(), 1);
                    },
                    BladesCard::Behead => {
                        Trophy::Behead.progress(store, @challenge.winner_address(), 1);
                    },
                    BladesCard::Grapple => {
                        Trophy::Grapple.progress(store, @challenge.winner_address(), 1);
                    },
                    BladesCard::Seppuku => {
                        Trophy::Seppuku.progress(store, @challenge.loser_address(), 1);
                    },
                    _ => {}
                }
            },
            _ => {}
        }
        match (hand_winner.card_tactics) {
            TacticsCard::Bananas => {
                Trophy::GoneBananas.progress(store, @challenge.winner_address(), 1);
            },
            _ => {}
        }
        let mut bonus = DuelBonus {
            duelist_a: if (*challenge.winner == 1) {bonus_winner} else {bonus_loser},
            duelist_b: if (*challenge.winner == 1) {bonus_loser} else {bonus_winner},
        };
        Self::_duel_misc(store, challenge, round, progress, last_pace, ref bonus);
        (bonus)
    }

    // Finished Duel in a draw
    fn duel_draw(world: @WorldStorage, challenge: @Challenge, round: @Round, progress: @DuelProgress) -> DuelBonus {
        let store: @ArcadeStore = @ArcadeStoreTrait::new(*world);
        let mut bonus: DuelBonus = Default::default();
        match (round.final_blow) {
            FinalBlow::Paces(pace) => {
                if (
                    progress.hand_a.card_fire == progress.hand_b.card_fire
                    && round.state_a.health.is_zero() // a died
                    && round.state_b.health.is_zero() // b died
                ) {
                    Trophy::BloodBath.progress(store, challenge.address_a, 1);
                    Trophy::BloodBath.progress(store, challenge.address_b, 1);
                    bonus.duelist_a.kill_pace = (*pace).into();
                    bonus.duelist_b.kill_pace = (*pace).into();
                }
            },
            FinalBlow::Blades(blade) => {
                if (*blade == BladesCard::Seppuku) {
                    Trophy::DoubleSeppuku.progress(store, challenge.address_a, 1);
                    Trophy::DoubleSeppuku.progress(store, challenge.address_b, 1);
                } else {
                    Trophy::BladesClash.progress(store, challenge.address_a, 1);
                    Trophy::BladesClash.progress(store, challenge.address_b, 1);
                }
            },
            _ => {}
        }
        Self::_duel_misc(store, challenge, round, progress, @PacesCard::Paces10, ref bonus);
        (bonus)
    }

    fn _duel_misc(store: @ArcadeStore, challenge: @Challenge, round: @Round, progress: @DuelProgress, last_pace: @PacesCard, ref bonus: DuelBonus) {
        // test dodge for both players
        Self::_duel_dodge(store, challenge.address_a, progress.hand_a, progress.hand_b, last_pace, ref bonus.duelist_a);
        Self::_duel_dodge(store, challenge.address_b, progress.hand_b, progress.hand_a, last_pace, ref bonus.duelist_b);
        // test odds for both players
        Self::_duel_odds(store, challenge.address_a, progress.hand_a, round.state_a, last_pace, ref bonus.duelist_a);
        Self::_duel_odds(store, challenge.address_b, progress.hand_b, round.state_b, last_pace, ref bonus.duelist_b);
        // shot at same pace...
        if (
            progress.hand_a.card_fire == progress.hand_b.card_fire
            && !round.state_a.has_hit() // a missed
            && !round.state_b.has_hit() // b missed
        ) {
            Trophy::Blindfold.progress(store, challenge.address_a, 1);
            Trophy::Blindfold.progress(store, challenge.address_b, 1);
        }
    }
    fn _duel_dodge(store: @ArcadeStore, address: @ContractAddress, hand_a: @DuelistHand, hand_b: @DuelistHand, last_pace: @PacesCard, ref bonus: DuelistBonus) {
        if (hand_a.card_dodge <= last_pace && hand_a.card_dodge == hand_b.card_fire) {
            Trophy::PerfectDodge.progress(store, address, 1);
            bonus.dodge = true;
        }
    }
    fn _duel_odds(store: @ArcadeStore, address: @ContractAddress, hand: @DuelistHand, state: @DuelistState, last_pace: @PacesCard, ref bonus: DuelistBonus) {
        if (hand.card_fire <= last_pace) {
            if (state.has_hit()) {
                bonus.hit = true;
                if (*state.chances <= 10) {
                    Trophy::BeatTheOdds.progress(store, address, 1);
                }
            } else if (*state.chances >= 90) {
                Trophy::WastedAmmo.progress(store, address, 1);
            }
        }
    }

    // duelist trophies
    fn duelist_scored(world: @WorldStorage, address: @ContractAddress, player_totals: @Totals, duelist_totals: @Totals, rewards: @RewardValues, won: bool) {
        let store: @ArcadeStore = @ArcadeStoreTrait::new(*world);
        if (!*rewards.survived) {
            if ((*duelist_totals).is_villain()) {
                Trophy::VillainousDeath.progress(store, address, 1);
            } else if ((*duelist_totals).is_trickster()) {
                Trophy::TricksterDeath.progress(store, address, 1);
            } else if ((*duelist_totals).is_lord()) {
                Trophy::HonourableDeath.progress(store, address, 1);
            }
        }
        if (won) {
            if (*player_totals.total_duels == 1 && *player_totals.total_wins == 1) {
                Trophy::BeginnersLuck.progress(store, address, 1);
            }
            if (*duelist_totals.total_wins == 1) {
                Trophy::FirstBlood.progress(store, address, 1);
            } else if (*duelist_totals.total_wins == 2) {
                Trophy::DoubleBarrel.progress(store, address, 1);
            } else if (*duelist_totals.total_wins == 3) {
                Trophy::TrippleBarrel.progress(store, address, 1);
            } else if (*duelist_totals.total_wins == 4) {
                Trophy::QuadrupleBarrel.progress(store, address, 1);
            } else if (*duelist_totals.total_wins == 5) {
                Trophy::QuintupleBarrel.progress(store, address, 1);
            }
        }
    }

    // other events
    fn collected_duel(world: @WorldStorage, player_address: @ContractAddress) {
        let store: @ArcadeStore = @ArcadeStoreTrait::new(*world);
        Trophy::DuelCollector.progress(store, player_address, 1);
    }
    fn collected_season(world: @WorldStorage, player_address: @ContractAddress) {
        let store: @ArcadeStore = @ArcadeStoreTrait::new(*world);
        Trophy::SeasonCollector.progress(store, player_address, 1);
    }
    fn the_thing(world: @WorldStorage, player_address: @ContractAddress) {
        let store: @ArcadeStore = @ArcadeStoreTrait::new(*world);
        Trophy::DoThatThing.progress(store, player_address, 1);
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {

    use super::{Trophy, TROPHY_ID};

    #[test]
    fn test_trophy_identifiers() {
        // invalid
        let mut last_trophy: Trophy = Trophy::None;
        let mut i: u8 = 1;
        while (i <= TROPHY_ID::COUNT) {
            let trophy: Trophy = i.into();
            assert_ne!(Trophy::None, trophy, "({}) is None", i);
            assert_ne!(last_trophy, trophy, "({}) == ({}): trophy", i, last_trophy);
            let ii: u8 = trophy.into();
            assert_eq!(i, ii, "({}) != ({}): trophy", i, ii);
            last_trophy = trophy;
            i += 1;
        };
        // end of trophies
        let trophy: Trophy = (TROPHY_ID::COUNT+1).into();
        assert_eq!(Trophy::None, trophy, "bad TROPHY_ID::COUNT");
    }
}
