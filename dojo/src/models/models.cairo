use starknet::ContractAddress;

#[derive(Model, Copy, Drop, Serde)]
struct Duelist {
    #[key]
    address: ContractAddress,
    name: felt252,
}

#[derive(Model, Copy, Drop, Serde)]
struct Duel {
    #[key]
    duelId: felt252,
    challenger: ContractAddress,
    challenged: ContractAddress,
    pass_code: felt252,
}
