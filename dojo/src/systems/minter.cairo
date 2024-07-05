use starknet::{ContractAddress};

#[dojo::interface]
trait IMinter {
    fn mint(ref world: IWorldDispatcher, to: ContractAddress, token_contract_address: ContractAddress) -> u128;
    fn set_open(ref world: IWorldDispatcher, token_contract_address: ContractAddress, is_open: bool);
    // fn get_token_svg(ref world: IWorldDispatcher, token_id: u128) -> ByteArray;
}

#[dojo::interface]
trait IMinterInternal {
    fn assert_caller_is_owner(world: @IWorldDispatcher);
}

#[dojo::contract]
mod minter {
    use debug::PrintTrait;
    use super::{IMinter};
    use zeroable::Zeroable;
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use pistols::systems::token_duelist::{ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait};
    use pistols::models::token_config::{TokenConfig, TokenConfigTrait};
    use pistols::types::constants::{constants};

    mod Errors {
        // admin
        const INVALID_TOKEN_ADDRESS: felt252 = 'MINTER: invalid token address';
        const INVALID_SUPPLY: felt252 = 'MINTER: invalid supply';
        const NOT_OWNER: felt252 = 'MINTER: not owner';
        // mint
        const MINTED_OUT: felt252 = 'MINTER: minted out';
        const MINTING_IS_CLOSED: felt252 = 'MINTER: minting closed';
        const MAXED_WALLET: felt252 = 'MINTER: wallet maxed out';
    }

    //---------------------------------------
    // params passed from overlays files
    // https://github.com/dojoengine/dojo/blob/328004d65bbbf7692c26f030b75fa95b7947841d/examples/spawn-and-move/manifests/dev/overlays/contracts/dojo_examples_others_others.toml
    // https://github.com/dojoengine/dojo/blob/328004d65bbbf7692c26f030b75fa95b7947841d/examples/spawn-and-move/src/others.cairo#L18
    // overlays generated with: sozo migrate --generate-overlays
    //
    fn dojo_init(
        world: @IWorldDispatcher,
        token_address: ContractAddress,
        max_supply: u16,
        max_per_wallet: u16,
        is_open: u8,
    ) {
        // 'dojo_init()...'.print();
        
        //*******************************
        let TOKEN_NAME = "Pistols at 10 Blocks Duelists";
        let TOKEN_SYMBOL = "DUELIST";
        let BASE_URI = "https://pistols.underware.gg";
        //*******************************

        assert(token_address.is_non_zero(), Errors::INVALID_TOKEN_ADDRESS);
        assert(max_supply > 0, Errors::INVALID_SUPPLY);

        //
        // Config
        set!(world, (TokenConfig{
            token_address,
            minter_address: get_contract_address(),
            max_supply,
            max_per_wallet,
            minted_count: 0,
            is_open: (is_open != 0),
        }));

        //
        // initialize token
        let token = (ITokenDuelistDispatcher{ contract_address: token_address });
        token.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
    }

    //---------------------------------------
    // IMinter
    //
    #[abi(embed_v0)]
    impl MinterImpl of IMinter<ContractState> {
        fn mint(ref world: IWorldDispatcher, to: ContractAddress, token_contract_address: ContractAddress) -> u128 {
            let token = (ITokenDuelistDispatcher{ contract_address: token_contract_address });

            // check availability
            let mut config: TokenConfig = get!(world, (token_contract_address), TokenConfig);
            assert(config.minted_count < config.max_supply, Errors::MINTED_OUT);
            assert(config.minted_count.into() < constants::MAX_DUELIST_ID, Errors::MINTED_OUT);
            assert(config.is_open, Errors::MINTING_IS_CLOSED);

            // check wallet
            let balance: u256 = token.balance_of(to);
            assert(balance.low < config.max_per_wallet.into(), Errors::MAXED_WALLET);
            
            // mint next token_id
            config.minted_count += 1;
            let token_id: u256 = config.minted_count.into();
            token.mint(to, token_id);

            set!(world, (config));

            // return minted token id
            (token_id.low)
        }

        fn set_open(ref world: IWorldDispatcher, token_contract_address: ContractAddress, is_open: bool) {
            self.assert_caller_is_owner();
            let mut config: TokenConfig = get!(world, (token_contract_address), TokenConfig);
            config.is_open = is_open;
            set!(world, (config));
        }
    }

    impl InternalImpl of super::IMinterInternal<ContractState> {
        #[inline(always)]
        fn assert_caller_is_owner(world: @IWorldDispatcher) {
            assert(world.is_owner(get_caller_address(), get_contract_address().into()), Errors::NOT_OWNER);
        }
    }

}
