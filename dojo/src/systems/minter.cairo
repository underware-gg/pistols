use starknet::{ContractAddress};

#[dojo::interface]
trait IMinter {
    fn mint(ref world: IWorldDispatcher, to: ContractAddress, token_contract_address: ContractAddress) -> u128;
    fn can_mint(world: @IWorldDispatcher, to: ContractAddress, token_contract_address: ContractAddress) -> bool;
    fn set_open(ref world: IWorldDispatcher, token_contract_address: ContractAddress, is_open: bool);
    // fn get_token_svg(ref world: IWorldDispatcher, token_id: u128) -> ByteArray;
}

#[dojo::contract]
mod minter {
    // use debug::PrintTrait;
    use super::{IMinter};
    use zeroable::Zeroable;
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use dojo::model::{Model, ModelEntity};

    use pistols::interfaces::systems::{
        WorldSystemsTrait,
        ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait,
        IAdminDispatcher, IAdminDispatcherTrait,
    };
    use pistols::models::token_config::{TokenConfig, TokenConfigEntity};
    use pistols::types::constants::{CONST};
    use pistols::libs::store::{Store, StoreTrait};

    mod Errors {
        // admin
        const INVALID_TOKEN_ADDRESS: felt252    = 'MINTER: invalid token address';
        const INVALID_SUPPLY: felt252           = 'MINTER: invalid supply';
        const NOT_ADMIN: felt252                = 'MINTER: not admin';
        // mint
        const MINTED_OUT: felt252               = 'MINTER: minted out';
        const MINTING_IS_CLOSED: felt252        = 'MINTER: minting closed';
        const MAXED_WALLET: felt252             = 'MINTER: wallet maxed out';
    }

    //---------------------------------------
    // params passed from overlays files
    // https://github.com/dojoengine/dojo/blob/328004d65bbbf7692c26f030b75fa95b7947841d/examples/spawn-and-move/manifests/dev/overlays/contracts/dojo_examples_others_others.toml
    // https://github.com/dojoengine/dojo/blob/328004d65bbbf7692c26f030b75fa95b7947841d/examples/spawn-and-move/src/others.cairo#L18
    // overlays generated with: sozo migrate --generate-overlays
    //
    fn dojo_init(
        ref world: IWorldDispatcher,
        token_address: ContractAddress,
        max_supply: u16,
        max_per_wallet: u16,
        is_open: u8,
    ) {
        assert(max_supply > 0, Errors::INVALID_SUPPLY);
        let store: Store = StoreTrait::new(world);
        let token_config: TokenConfig = TokenConfig{
            token_address,
            max_supply,
            max_per_wallet,
            minted_count: 0,
            is_open: (is_open != 0),
        };
        store.set_token_config(@token_config);
    }

    //---------------------------------------
    // IMinter
    //
    #[abi(embed_v0)]
    impl MinterImpl of IMinter<ContractState> {
        fn mint(ref world: IWorldDispatcher, to: ContractAddress, token_contract_address: ContractAddress) -> u128 {
            assert(token_contract_address.is_non_zero(), Errors::INVALID_TOKEN_ADDRESS);
            let token = (ITokenDuelistDispatcher{ contract_address: token_contract_address });

            // check availability
            let store = StoreTrait::new(world);
            let mut config: TokenConfigEntity = store.get_token_config_entity(token_contract_address);
            assert(config.minted_count < config.max_supply, Errors::MINTED_OUT);
            assert(config.minted_count.into() < CONST::MAX_DUELIST_ID, Errors::MINTED_OUT);
            assert(config.is_open, Errors::MINTING_IS_CLOSED);

            // check wallet
            let balance: u256 = token.balance_of(to);
            assert(balance.low < config.max_per_wallet.into(), Errors::MAXED_WALLET);
            
            // mint next token_id
            config.minted_count += 1;
            let token_id: u256 = config.minted_count.into();
            token.mint(to, token_id);

            store.set_token_config_entity(@config);

            // return minted token id
            (token_id.low)
        }

        fn can_mint(world: @IWorldDispatcher, to: ContractAddress, token_contract_address: ContractAddress) -> bool {
            assert(token_contract_address.is_non_zero(), Errors::INVALID_TOKEN_ADDRESS);
            let store = StoreTrait::new(world);
            let config: TokenConfigEntity = store.get_token_config_entity(token_contract_address);
            let token = (ITokenDuelistDispatcher{ contract_address: token_contract_address });
            let balance: u256 = token.balance_of(to);
            (
                (config.minted_count < config.max_supply) &&
                (config.minted_count.into() < CONST::MAX_DUELIST_ID) &&
                (config.is_open) &&
                (balance.low < config.max_per_wallet.into())
            )
        }

        fn set_open(ref world: IWorldDispatcher, token_contract_address: ContractAddress, is_open: bool) {
            assert(world.admin_dispatcher().am_i_admin(get_caller_address()) == true, Errors::NOT_ADMIN);
            let store = StoreTrait::new(world);
            let mut config: TokenConfigEntity = store.get_token_config_entity(token_contract_address);
            config.is_open = is_open;
            store.set_token_config_entity(@config);
        }
    }

}
