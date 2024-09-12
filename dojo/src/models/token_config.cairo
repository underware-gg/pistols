use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenConfig {
    #[key]
    pub token_address: ContractAddress,
    //------
    pub max_supply: u16,
    pub max_per_wallet: u16,
    pub minted_count: u16,
    pub is_open: bool,
}
