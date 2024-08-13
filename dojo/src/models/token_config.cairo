use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenConfig {
    #[key]
    token_address: ContractAddress,
    //------
    max_supply: u16,
    max_per_wallet: u16,
    minted_count: u16,
    is_open: bool,
}
