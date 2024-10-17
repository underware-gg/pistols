use starknet::{ContractAddress, get_contract_address};
use openzeppelin_token::erc721::{ERC721Component};    
use pistols::systems::tokens::duelist::{IDuelistToken, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::models::{
    duelist::{Duelist},
    token_config::{TokenConfig, TokenConfigTrait},
};

pub impl ERC721HooksImpl<TContractState> of ERC721Component::ERC721HooksTrait<TContractState> {
    fn before_update(ref self: ERC721Component::ComponentState<TContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {}
    fn after_update(ref self: ERC721Component::ComponentState<TContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {}
    fn token_uri(
        self: @ERC721Component::ComponentState<TContractState>,
        token_id: u256,
    ) -> ByteArray {
        let selfie = IDuelistTokenDispatcher{ contract_address: get_contract_address() };
        let store = StoreTrait::new(selfie.world());
        let token_config: TokenConfig = store.get_token_config(get_contract_address());
        let duelist: Duelist = store.get_duelist(token_id.low);
        (token_config.render_uri(token_id, duelist, false))
    }
}
