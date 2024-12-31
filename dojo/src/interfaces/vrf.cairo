use starknet::ContractAddress;

//
// VRF consumer
// https://docs.cartridge.gg/vrf/overview
//
// from:
// https://github.com/cartridge-gg/vrf/blob/efbc9db32d6357f9df2cad0dceca5cabe04a1bf3/src/vrf_provider/vrf_provider_component.cairo
//

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}

#[starknet::interface]
trait IVrfProvider<TState> {
    // called before game transaction
    fn request_random(self: @TState, caller: ContractAddress, source: Source);
    // called in game transaction
    fn consume_random(ref self: TState, source: Source) -> felt252;
}
