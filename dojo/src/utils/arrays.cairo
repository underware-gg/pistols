use core::num::traits::Zero;
use core::ops::AddAssign;

//
// Based on Alexandria array and span extensions
// https://github.com/keep-starknet-strange/alexandria/blob/main/packages/data_structures/src/array_ext.cairo
// https://github.com/keep-starknet-strange/alexandria/blob/main/packages/data_structures/src/span_ext.cairo
//

#[generate_trait]
pub impl SpanUtilsImpl<T, +Clone<T>, +Drop<T>> of SpanUtilsTrait<T> {
    fn value_or_zero<+Copy<T>, +Zero<T>>(self: Span<T>, index: usize) -> T {
        (if (index < self.len()) { *self[index] } else { Zero::zero() })
    }
    fn sum_values<+Zero<T>, +Copy<T>, +AddAssign<T, T>>(mut self: Span<T>) -> T {
        let mut ret: T = Zero::zero();
        loop {
            match self.pop_front() {
                Option::Some(v) => { ret += *v; },
                Option::None => { break; },
            };
        };
        (ret)
    }
    fn sum_range<+Zero<T>, +Copy<T>, +AddAssign<T, T>>(self: Span<T>, start_index: usize, length: usize) -> T {
        let mut ret: T = Zero::zero();
        let mut i: usize = 0;
        while (i < length) {
            ret += *self[start_index + i];
            i += 1;
        };
        (ret)
    }
    //
    // from alexandria
    fn contains<+PartialEq<T>>(mut self: Span<T>, value: @T) -> bool {
        loop {
            match self.pop_front() {
                Option::Some(v) => { if v == value { break true; } },
                Option::None => { break false; },
            };
        }
    }
    fn remove<+PartialEq<T>>(mut self: Span<T>, value: @T) -> Array<T> {
        let mut ret: Array<T> = array![];
        loop {
            match self.pop_front() {
                Option::Some(v) => {
                    if (v != value) {
                        ret.append(v.clone());
                    }
                },
                Option::None => { break; },
            };
        };
        (ret)
    }
    fn concat(self: Span<T>, other: Span<T>) -> Array<T> {
        let mut ret = array![];
        ret.extend_from_span(self);
        ret.extend_from_span(other);
        (ret)
    }
}

#[generate_trait]
pub impl ArrayUtilsImpl<T, +Clone<T>, +Drop<T>> of ArrayUtilsTrait<T> {
    fn value_or_zero<+Copy<T>, +Zero<T>>(self: @Array<T>, index: usize) -> T {
        (if (index < self.len()) { *self[index] } else { Zero::zero() })
    }
    //
    // from alexandria
    fn contains<+PartialEq<T>>(self: @Array<T>, value: @T) -> bool {
        (self.span().contains(value))
    }
    fn remove<+PartialEq<T>>(self: @Array<T>, value: @T) -> Array<T> {
        (self.span().remove(value))
    }
    fn extend_from_span<+Destruct<T>>(ref self: Array<T>, mut other: Span<T>) {
        while let Option::Some(elem) = other.pop_front() {
            self.append(elem.clone());
        }
    }
    fn concat(self: @Array<T>, other: @Array<T>) -> Array<T> {
        (self.span().concat(other.span()))
    }
}

#[cfg(test)]
#[generate_trait]
pub impl ArrayTestUtilsImpl<T, +Clone<T>, +Drop<T>> of ArrayTestUtilsTrait<T> {
    fn assert_array_eq<+PartialEq<T>, +core::fmt::Debug<T>>(v1: Array<T>, v2: Array<T>, prefix: ByteArray) {
        assert_eq!(v1.len(), v2.len(), "[{}] Invalid values length", prefix);
        let mut i = 0;
        while (i < v1.len()) {
            assert_eq!(v1.at(i), v2.at(i), "[{}] Invalid value {}", prefix, i);
            i += 1;
        }
    }
    fn assert_span_eq<+PartialEq<T>, +core::fmt::Debug<T>>(v1: Span<T>, v2: Span<T>, prefix: ByteArray) {
        assert_eq!(v1.len(), v2.len(), "[{}] Invalid values length", prefix);
        let mut i = 0;
        while (i < v1.len()) {
            assert_eq!(v1.at(i), v2.at(i), "[{}] Invalid value {}", prefix, i);
            i += 1;
        }
    }
}


//----------------------------------------
// Defaults
//

pub impl SpanDefault<T, +Drop<T>> of Default<Span<T>> {
    fn default() -> Span<T> {
        let arr = core::array::ArrayTrait::<T>::new();
        (arr.span())
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{ArrayUtilsTrait, SpanUtilsTrait};

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
                assert!(arr0.contains(@i), "array_contains_0_!true");
                assert!(!arr1.contains(@i), "array_contains_1_!false");
                assert!(span0.contains(@i), "span_contains_0_!true");
                assert!(!span1.contains(@i), "span_contains_1_!false");
            }
            i += 1;
        };
    }

    #[test]
    fn test_array_remove() {
        let mut array: Array<usize> = array![0, 2, 3, 4];
        let mut span: Span<usize> = array.span();
        // remove 2
        array = array.remove(@2);
        span = span.remove(@2).span();
        assert_eq!(array.len(), 3, "[removed 2]");
        assert_eq!(span.len(), 3, "[removed 2]");
        assert_eq!(*array[0], 0, "[removed 2]");
        assert_eq!(*array[1], 3, "[removed 2]");
        assert_eq!(*array[2], 4, "[removed 2]");
        assert_eq!(*span[0], 0, "[removed 2]");
        assert_eq!(*span[1], 3, "[removed 2]");
        assert_eq!(*span[2], 4, "[removed 2]");
        // remove non-existent
        array = array.remove(@2);
        span = span.remove(@2).span();
        assert_eq!(array.len(), 3, "[removed 2 again]");
        assert_eq!(span.len(), 3, "[removed 2 again]");
        assert_eq!(*array[0], 0, "[removed 2 again]");
        assert_eq!(*array[1], 3, "[removed 2 again]");
        assert_eq!(*array[2], 4, "[removed 2 again]");
        assert_eq!(*span[0], 0, "[removed 2 again]");
        assert_eq!(*span[1], 3, "[removed 2 again]");
        assert_eq!(*span[2], 4, "[removed 2 again]");
        // remove back
        array = array.remove(@4);
        span = span.remove(@4).span();
        assert_eq!(array.len(), 2, "[removed back]");
        assert_eq!(span.len(), 2, "[removed back]");
        assert_eq!(*array[0], 0, "[removed back]");
        assert_eq!(*array[1], 3, "[removed back]");
        assert_eq!(*span[0], 0, "[removed back]");
        assert_eq!(*span[1], 3, "[removed back]");
        // remove front
        array = array.remove(@0);
        span = span.remove(@0).span();
        assert_eq!(array.len(), 1, "[removed front]");
        assert_eq!(span.len(), 1, "[removed front]");
        assert_eq!(*array[0], 3, "[removed front]");
        assert_eq!(*span[0], 3, "[removed front]");
        // remove last
        array = array.remove(@3);
        span = span.remove(@3).span();
        assert_eq!(array.len(), 0, "[removed last]");
        assert_eq!(span.len(), 0, "[removed last]");
    }

    #[test]
    fn test_array_value_or_zero() {
        let arr: Array<usize> = array![11, 22, 33];
        let span: Span<usize> = arr.span();
        // test default values
        assert_eq!(arr.value_or_zero(0), 11, "array_value_or_zero(0) != 11");
        assert_eq!(arr.value_or_zero(1), 22, "array_value_or_zero(1) != 22");
        assert_eq!(arr.value_or_zero(2), 33, "array_value_or_zero(2) != 33");
        assert_eq!(arr.value_or_zero(3), 0, "array_value_or_zero(3) != 0");
        assert_eq!(arr.value_or_zero(999), 0, "array_value_or_zero(999) != 0");
        assert_eq!(span.value_or_zero(0), 11, "span_value_or_zero(0) != 11");
        assert_eq!(span.value_or_zero(1), 22, "span_value_or_zero(1) != 22");
        assert_eq!(span.value_or_zero(2), 33, "span_value_or_zero(2) != 33");
        assert_eq!(span.value_or_zero(3), 0, "span_value_or_zero(3) != 0");
        assert_eq!(span.value_or_zero(999), 0, "span_value_or_zero(999) != 0");
    }

    #[test]
    fn test_span_sum_range() {
        let arr: Array<usize> = array![1, 2, 3, 4, 5];
        let span: Span<usize> = arr.span();
        // test default values
        assert_eq!([].span().sum_values(), 0, "sum_values()");
        assert_eq!(span.sum_values(), 15, "sum_values()");
        assert_eq!(span.sum_range(0,0), 0, "sum_range()");
        assert_eq!(span.sum_range(2,0), 0, "sum_range()");
        assert_eq!(span.sum_range(4,0), 0, "sum_range()");
        assert_eq!(span.sum_range(0,1), 1, "sum_range()");
        assert_eq!(span.sum_range(0,2), 3, "sum_range()");
        assert_eq!(span.sum_range(0,3), 6, "sum_range()");
        assert_eq!(span.sum_range(0,4), 10, "sum_range()");
        assert_eq!(span.sum_range(0,5), 15, "sum_range()");
        assert_eq!(span.sum_range(2,1), 3, "sum_range()");
        assert_eq!(span.sum_range(4,1), 5, "sum_range()");
        assert_eq!(span.sum_range(2,2), 7, "sum_range()");
        assert_eq!(span.sum_range(2,3), 12, "sum_range()");
    }
}
