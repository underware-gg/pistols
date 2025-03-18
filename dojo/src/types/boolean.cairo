
#[derive(Copy, Drop, Serde, PartialEq)]
pub enum Boolean {
    Undefined: (),
    True: (),
    False: (),
}

impl BooleanIntoByteArray of core::traits::Into<Boolean, ByteArray> {
    fn into(self: Boolean) -> ByteArray {
        match self {
            Boolean::Undefined =>   "Undefined",
            Boolean::True =>        "True",
            Boolean::False =>       "False",
        }
    }
}
