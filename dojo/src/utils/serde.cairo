// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts for Cairo v2.0.0-alpha.1 (utils/src/serde.cairo)
// https://github.com/OpenZeppelin/cairo-contracts/blob/a0369246a45f1aca404e6a8cdfb6dd78b0f57bb0/packages/utils/src/serde.cairo

pub trait SerializedAppend<T> {
    fn append_serde(ref self: Array<felt252>, value: T);
}

impl SerializedAppendImpl<T, impl TSerde: Serde<T>, impl TDrop: Drop<T>> of SerializedAppend<T> {
    fn append_serde(ref self: Array<felt252>, value: T) {
        value.serialize(ref self);
    }
}
