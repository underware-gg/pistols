use starknet::ContractAddress;

#[dojo::model]
#[derive(Copy, Drop, Serde)]
struct TokenConfig {
    #[key]
    token_address: ContractAddress,
    //------
    minter_address: ContractAddress,
    painter_address: ContractAddress,
    max_supply: u128,
    cool_down: bool,
    is_open: bool,
}

#[generate_trait]
impl TokenConfigTraitImpl of TokenConfigTrait {
    fn is_minter(self: TokenConfig, address: ContractAddress) -> bool {
        (self.minter_address == address)
    }
}
