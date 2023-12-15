use array::ArrayTrait;

// trait ArrayTrait<T>  {
//     fn create() -> Array<T>;
// }

mod array_utils {
    fn create_array<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>>(size: usize, default_value: T) -> Array::<T> {
        let mut result: Array<T> = ArrayTrait::new();
        let mut i: usize = 0;
        loop {
            if(i >= size) { break; }
            result.append(default_value);
            i += 1;
        };
        result
    }

    // based on:
    // https://github.com/keep-starknet-strange/alexandria/blob/main/src/data_structures/src/array_ext.cairo
    fn reverse<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>>(mut array: Span<T>) -> Array<T> {
        let mut result: Array<T> = ArrayTrait::new();
        loop {
            match array.pop_back() {
                Option::Some(v) => { result.append(*v); },
                Option::None => {
                    break; // Can't `break result;` "Variable was previously moved"
                },
            };
        };
        result
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use pistols::utils::arrays::{array_utils};

    #[test]
    #[available_gas(10_000_00)]
    fn test_create_array_u8() {
        let arr0 = array_utils::create_array(0, 1_u8);
        let arr1 = array_utils::create_array(5, 255_u8);
        // test sizes
        assert(arr0.len() == 0, 'array 0 size');
        assert(arr1.len() == 5, 'array 1 size');
        // test default values
        let mut i: usize = 0;
        loop {
            if(i >= arr1.len()) { break; }
            assert(*arr1[i] == 255_u8, 'array 1 value');
            i += 1;
        };
    }

    #[test]
    #[available_gas(10_000_00)]
    fn reverse_span() {
        let mut arr1 = array![21_u8];
        let inv1: Array<u8> = array_utils::reverse(arr1.span());
        assert(inv1.len() == 1, 'Len should be 1');
        assert(*inv1[0] == 21, 'Should be 21');

        let mut arr2 = array![21_u8, 42_u8];
        let inv2: Array<u8> = array_utils::reverse(arr2.span());
        assert(inv2.len() == 2, 'Len should be 2');
        assert(*inv2[0] == 42, 'Should be 42');
        assert(*inv2[1] == 21, 'Should be 21');

        let mut arr3 = array![21_u8, 42_u8, 84_u8];
        let inv3: Array<u8> = array_utils::reverse(arr3.span());
        assert(inv3.len() == 3, 'Len should be 3');
        assert(*inv3[0] == 84, 'Should be 84');
        assert(*inv3[1] == 42, 'Should be 42');
        assert(*inv3[2] == 21, 'Should be 21');
    }
}
