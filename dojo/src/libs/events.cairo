use traits::{Into, TryInto};
use starknet::{ContractAddress};
use pistols::models::duelist::{ProfilePicType};

#[derive(Drop, starknet::Event)]
pub struct DuelistRegisteredEvent {
    address: ContractAddress,
    duelist_id: u128,
    name: felt252,
    profile_pic_type: ProfilePicType,
    profile_pic_uri: ByteArray,
    is_new: bool,
}

#[derive(Drop, starknet::Event)]
pub struct NewChallengeEvent {
    duel_id: u128,
    address_a: ContractAddress,
    address_b: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct ChallengeAcceptedEvent {
    duel_id: u128,
    address_a: ContractAddress,
    address_b: ContractAddress,
    accepted: bool,
}

#[derive(Drop, starknet::Event)]
pub struct ChallengeResolvedEvent {
    duel_id: u128,
    winner_address: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct DuelistTurnEvent {
    duel_id: u128,
    address: ContractAddress,
    round_number: u8,
}

//
// Emitted events are idenfified by the event name selector key
// which can be found like this:
// $ starkli selector NewChallengeEvent
// 0x014a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975
// + REMOVE ZEROS
// 0x14a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975
//
mod EVENT_SELECTOR {
    const DuelistRegisteredEvent: felt252 = 0x148c3db21a55576bc012023dc4d3b5bd570c519de855849eac52b1c5d6c9e85;
    const NewChallengeEvent: felt252 = 0x14a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975;
    const ChallengeAcceptedEvent: felt252 = 0x31cdbf7ac39747303190a727df1a270ae5e4f05191f6f58e452ce4eb1e98abe;
    const ChallengeResolvedEvent: felt252 = 0x23dfe05a8414fd8464370e120099be69327b2a52ae6655ff23733651e8281b1;
    const DuelistTurnEvent: felt252 = 0x19556e1418f1e7a7e6962eff75d1a46abd50bda431139f855ba85c9119754a4;
}


//------------------------------------
// Emitters
//

// TODO: implement new dojo::event
// https://discord.com/channels/1062934010722005042/1062934060898459678/1298036213382647820

// #[derive(Copy, Drop, Serde)]
// #[dojo::event]
// pub struct MyEvent {
//     #[key]
//     pub player: ContractAddress,
//     pub data: u32,
// }
// fn _emit_my_event(world: @IWorldDispatcher) {
//     let me = MyEvent { player: starknet::get_caller_address(), data: 2 };
//     me.emit(world);
// }



mod emitters {
    use starknet::{ContractAddress};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use pistols::models::{
        challenge::{Challenge},
        duelist::{Duelist},
    };

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        DuelistRegisteredEvent: super::DuelistRegisteredEvent,
        NewChallengeEvent: super::NewChallengeEvent,
        ChallengeAcceptedEvent: super::ChallengeAcceptedEvent,
        ChallengeResolvedEvent: super::ChallengeResolvedEvent,
        DuelistTurnEvent: super::DuelistTurnEvent,
    }

    fn emitDuelistRegisteredEvent(_world: @IWorldDispatcher, _address: ContractAddress, _duelist: Duelist, _is_new: bool) {
        // emit!(world, (Event::DuelistRegisteredEvent(super::DuelistRegisteredEvent {
        //     address,
        //     duelist_id: duelist.duelist_id,
        //     name: duelist.name,
        //     profile_pic_type: duelist.profile_pic_type,
        //     profile_pic_uri: duelist.profile_pic_uri,
        //     is_new,
        // })));
    }
    fn emitNewChallengeEvent(_world: @IWorldDispatcher, _challenge: Challenge) {
        // emit!(world, (Event::NewChallengeEvent (super::NewChallengeEvent {
        //     duel_id: challenge.duel_id,
        //     address_a: challenge.address_a,
        //     address_b: challenge.address_b,
        // })));
    }
    fn emitChallengeAcceptedEvent(_world: @IWorldDispatcher, _challenge: Challenge, _accepted: bool) {
        // emit!(world, (Event::ChallengeAcceptedEvent (super::ChallengeAcceptedEvent {
        //     duel_id: challenge.duel_id,
        //     address_a: challenge.address_a,
        //     address_b: challenge.address_b,
        //     accepted,
        // })));
    }
    fn emitPostRevealEvents(_world: @IWorldDispatcher, _challenge: Challenge) {
        // WORLD(world);
        // if (challenge.state == ChallengeState::InProgress) {
        //     emitters::emitDuelistTurnEvent(world, challenge);
        // } else if (challenge.state == ChallengeState::Resolved || challenge.state == ChallengeState::Draw) {
        //     emitters::emitChallengeResolvedEvent(world, challenge);
        // }
    }
    fn emitDuelistTurnEvent(_world: @IWorldDispatcher, _challenge: Challenge) {
        // let address: ContractAddress =
        //     if (challenge.address_a == starknet::get_caller_address()) { (challenge.address_b) }
        //     else { (challenge.address_a) };
        // emit!(world, (Event::DuelistTurnEvent(super::DuelistTurnEvent {
        //     duel_id: challenge.duel_id,
        //     round_number: challenge.round_number,
        //     address,
        // })));
    }
    fn emitChallengeResolvedEvent(_world: @IWorldDispatcher, _challenge: Challenge) {
        // let winner_address: ContractAddress = 
        //     if (challenge.winner == 1) { (challenge.address_a) }
        //     else if (challenge.winner == 2) { (challenge.address_b) }
        //     else { (ZERO()) };
        // emit!(world, (Event::ChallengeResolvedEvent(super::ChallengeResolvedEvent {
        //     duel_id: challenge.duel_id,
        //     winner_address,
        // })));
    }
}
