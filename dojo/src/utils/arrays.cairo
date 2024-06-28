
//
// From Alexandria:
// https://github.com/keep-starknet-strange/alexandria/blob/main/packages/data_structures/src/array_ext.cairo
// https://github.com/keep-starknet-strange/alexandria/blob/main/packages/data_structures/src/span_ext.cairo
//

#[generate_trait]
impl SpanImpl<T> of SpanTrait<T> {
    fn contains<+PartialEq<T>>(mut self: Span<T>, value: @T) -> bool {
        loop {
            match self.pop_front() {
                Option::Some(v) => { if v == value {
                    break true;
                } },
                Option::None => { break false; },
            };
        }
    }
}

#[generate_trait]
impl ArrayImpl<T> of ArrayTrait<T> {
    fn contains<+PartialEq<T>>(self: @Array<T>, value: @T) -> bool {
        (self.span().contains(value))
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use super::{ArrayTrait, SpanTrait};

    #[test]
    #[available_gas(10_000_00)]
    fn test_array_contains() {
        let arr0: Array<usize> = array![0, 2, 4];
        let arr1: Array<usize> = array![1, 3, 5];
        // test default values
        let mut i: usize = 0;
        loop {
            if(i == arr0.len()) { break; }
            if (i % 2 == 0) {
                assert(arr0.contains(@i) == true, '!true');
                assert(arr1.contains(@i) == false, '!false');
            }
            i += 1;
        };
    }

}
