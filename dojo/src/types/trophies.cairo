use starknet::{ContractAddress};
use dojo::world::{WorldStorage};
use achievement::types::task::{
    Task as ArcadeTask,
    TaskTrait as ArcadeTaskTrait,
};
use achievement::store::{
    // Store as ArcadeStore,
    StoreTrait as ArcadeStoreTrait
};

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

#[derive(Copy, Drop)]
pub enum Trophy {
    None,
    FirstBlood,
    Collector,
}

pub mod TROPHY {
    pub const COUNT: u8 = 2;
}

pub mod TROPHY_ID {
    pub const None: felt252 = '';
    pub const FirstBlood: felt252 = 'FIRST_BLOOD';
    pub const Collector: felt252 = 'COLLECTOR';
}

#[generate_trait]
pub impl TrophyImpl of TrophyTrait {
    #[inline]
    fn identifier(self: @Trophy) -> felt252 {
        match self {
            Trophy::None        => TROPHY_ID::None,
            Trophy::FirstBlood  => TROPHY_ID::FirstBlood,
            Trophy::Collector   => TROPHY_ID::Collector,
        }
    }

    #[inline]
    fn hidden(self: @Trophy) -> bool {
        match self {
            _ => true,
        }
    }

    #[inline]
    fn index(self: @Trophy) -> u8 {
        match self {
            Trophy::None        => 0,
            // Group: Player
            Trophy::FirstBlood  => 0,
            // Group: Other
            Trophy::Collector   => 0,
        }
    }

    #[inline]
    fn points(self: @Trophy) -> u16 {
        match self {
            Trophy::None        => 0,
            Trophy::FirstBlood  => 50,
            Trophy::Collector   => 1,
        }
    }

    #[inline]
    fn start(self: @Trophy) -> u64 {
        match self {
            _ => 0,
        }
    }

    #[inline]
    fn end(self: @Trophy) -> u64 {
        match self {
            _ => 0,
        }
    }

    #[inline]
    fn group(self: @Trophy) -> felt252 {
        match self {
            Trophy::None        => 0,
            Trophy::FirstBlood  => 'Player',
            Trophy::Collector   => 'Other',
        }
    }

    // from: https://fontawesome.com/icons
    #[inline]
    fn icon(self: @Trophy) -> felt252 {
        match self {
            Trophy::None        => 'circle-question',
            Trophy::FirstBlood  => 'droplet',
            Trophy::Collector   => 'briefcase-arrow-right',
        }
    }

    #[inline]
    fn title(self: @Trophy) -> felt252 {
        match self {
            Trophy::None        => 'None',
            Trophy::FirstBlood  => 'First Blood',
            Trophy::Collector   => 'Collector',
        }
    }


    #[inline]
    fn description(self: @Trophy) -> ByteArray {
        match self {
            Trophy::None        => "This is not the trophy you're looking for",
            Trophy::FirstBlood  => "That's how it feels!",
            Trophy::Collector   => "Someone has to clean up the mess",
        }
    }

    #[inline]
    fn task_description(self: @Trophy) -> ByteArray {
        match self {
            Trophy::None        => "Nothing to do here",
            Trophy::FirstBlood  => "Win a Duel",
            Trophy::Collector   => "Collect the spoils of the season",
        }
    }

    #[inline]
    fn task_count(self: @Trophy) -> u32 {
        match self {
            Trophy::None        => 0,
            Trophy::FirstBlood  => 1,
            Trophy::Collector   => 1,
        }
    }

    #[inline]
    fn tasks(self: @Trophy) -> Span<ArcadeTask> {
        let task: ArcadeTask = ArcadeTaskTrait::new(
            self.identifier(),
            self.task_count(),
            self.task_description(),
        );
        ([task].span())
    }

    #[inline]
    fn data(self: @Trophy) -> ByteArray {
        ("")
    }

    // send a progress event to the arcade store
    // https://github.com/cartridge-gg/arcade/blob/main/packages/achievement/src/components/achievable.cairo#L99-L112
    // https://github.com/cartridge-gg/arcade/blob/main/packages/achievement/src/store.cairo#L59-L63
    fn progress(self: @Trophy, world: WorldStorage, player_address: ContractAddress, count: u32) {
        let arcade_store = ArcadeStoreTrait::new(world);
        arcade_store.progress(
            player_address.into(),
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
    #[inline]
    fn into(self: Trophy) -> u8 {
        match self {
            Trophy::None        => 0,
            Trophy::FirstBlood  => 1,
            Trophy::Collector   => 2,
        }
    }
}

pub impl IntoU8Trophy of core::traits::Into<u8, Trophy> {
    #[inline]
    fn into(self: u8) -> Trophy {
        let card: felt252 = self.into();
        match card {
            0 => Trophy::None,
            1 => Trophy::FirstBlood,
            2 => Trophy::Collector,
            _ => Trophy::None,
        }
    }
}
