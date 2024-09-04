use core::num::traits::Zero;

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
    fn value_or_zero<+Copy<T>, +Zero<T>>(self: Span<T>, index: usize) -> T {
        (if (index < self.len()) { *self[index] } else { Zero::zero() })
    }
}

#[generate_trait]
impl ArrayImpl<T> of ArrayTrait<T> {
    fn contains<+PartialEq<T>>(self: @Array<T>, value: @T) -> bool {
        (self.span().contains(value))
    }
    fn value_or_zero<+Copy<T>, +Zero<T>>(self: @Array<T>, index: usize) -> T {
        (self.span().value_or_zero(index))
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
    fn test_array_contains() {
        let arr0: Array<usize> = array![0, 2, 4];
        let arr1: Array<usize> = array![1, 3, 5];
        let span0: Span<usize> = arr0.span();
        let span1: Span<usize> = arr1.span();
        // test default values
        let mut i: usize = 0;
        loop {
            if(i == arr0.len()) { break; }
            if (i % 2 == 0) {
                assert(arr0.contains(@i) == true, 'array_contains_0_!true');
                assert(arr1.contains(@i) == false, 'array_contains_1_!false');
                assert(span0.contains(@i) == true, 'span_contains_0_!true');
                assert(span1.contains(@i) == false, 'span_contains_1_!false');
            }
            i += 1;
        };
    }

    #[test]
    fn test_array_value_or_zero() {
        let arr: Array<usize> = array![11, 22, 33];
        let span: Span<usize> = arr.span();
        // test default values
        assert(arr.value_or_zero(0) == 11, 'array_value_or_zero(0) != 11');
        assert(arr.value_or_zero(1) == 22, 'array_value_or_zero(1) != 22');
        assert(arr.value_or_zero(2) == 33, 'array_value_or_zero(2) != 33');
        assert(arr.value_or_zero(3) == 0, 'array_value_or_zero(3) != 0');
        assert(arr.value_or_zero(999) == 0, 'array_value_or_zero(999) != 0');
        assert(span.value_or_zero(0) == 11, 'span_value_or_zero(0) != 11');
        assert(span.value_or_zero(1) == 22, 'span_value_or_zero(1) != 22');
        assert(span.value_or_zero(2) == 33, 'span_value_or_zero(2) != 33');
        assert(span.value_or_zero(3) == 0, 'span_value_or_zero(3) != 0');
        assert(span.value_or_zero(999) == 0, 'span_value_or_zero(999) != 0');
    }
}
