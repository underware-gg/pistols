use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenConfig {
    #[key]
    pub token_address: ContractAddress,
    //------
    pub minter_address: ContractAddress,
    pub renderer_address: ContractAddress,
    pub treasury_address: ContractAddress,
    pub fee_contract: ContractAddress,
    pub fee_amount: u128,
    pub minted_count: u128,
}
