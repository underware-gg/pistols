
#[derive(Copy, Drop, Serde, PartialEq)]
enum Boolean {
    Undefined: (),
    True: (),
    False: (),
}

impl BooleanIntoByteArray of Into<Boolean, ByteArray> {
    fn into(self: Boolean) -> ByteArray {
        match self {
            Boolean::Undefined =>   "Undefined",
            Boolean::True =>        "True",
            Boolean::False =>       "False",
        }
    }
}
