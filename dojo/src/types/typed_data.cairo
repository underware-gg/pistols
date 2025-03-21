use core::hash::HashStateExTrait;
use core::poseidon::PoseidonTrait;
use core::hash::{HashStateTrait}; //, Hash};
use starknet::{ContractAddress};

// use openzeppelin::utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHashImpl};
use pistols::utils::openzeppelin::snip12::{SNIP12Metadata, StructHash, OffchainMessageHashImpl};
// use openzeppelin_account::dual_account::{DualCaseAccount, DualCaseAccountABI};

pub mod TYPED_DATA {
    pub const NAME: felt252 = 'Underware_gg';
    pub const VERSION: felt252 = '1.0.0';

    // TODO: update this!
    // "Message"("duelId":"felt","duelistId":"felt") 
    pub const COMMIT_MOVE_MESSAGE_TYPE_HASH: felt252 = 0x74fe0c723488214ab442c24761e9b32d30216def5e93d1c110375d993482ae;
}

pub impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 { TYPED_DATA::NAME }
    fn version() -> felt252 { TYPED_DATA::VERSION }
}

#[derive(Copy, Drop, Hash)]
pub struct CommitMoveMessage {
    pub duelId: felt252,
    pub duelistId: felt252,
}

pub impl StructHashImpl of StructHash<CommitMoveMessage> {
    fn hash_struct(self: @CommitMoveMessage) -> felt252 {
        // https://book.cairo-lang.org/ch11-04-hash.html#working-with-hashes
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(TYPED_DATA::COMMIT_MOVE_MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

#[generate_trait]
// impl CommitMoveMessageImpl of CommitMoveMessageTrait {
pub impl CommitMoveMessageImpl<
    T, +StructHash<T>,
> of CommitMoveMessageTrait<T> {
    fn validate(self: @T, contract_address: ContractAddress, signature: Array<felt252>) -> bool {
        let _message_hash = self.get_message_hash(contract_address);
// message_hash.print();
        // let is_valid_signature_felt = DualCaseAccount{contract_address}.is_valid_signature(message_hash, signature);
        let is_valid_signature_felt = 0;
        let is_valid_signature = is_valid_signature_felt == starknet::VALIDATED || is_valid_signature_felt == 1;
        (is_valid_signature)
    }
}