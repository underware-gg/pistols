import { expect, test } from "vitest";
import { cairo, CairoCustomEnum } from "starknet";
import { makeCustomEnum, parseCustomEnum, parseEnumVariant } from "./starknet_enum";
import { bigintToHex } from "../utils/misc/types";

//---------------------------------------
// CairoCustomEnum helpers
//
// test enums based on:
// https://starknetjs.com/docs/guides/cairo_enum/#send-cairo-custom-enum
//
// struct Order {
//   p1: u16,
//   p2: u16,
// }
// enum UserType {
//   Root,
//   Admin,
//   Guest,
// }
// enum MyEnum {
//   Error: (u16,u16),
//   Warning: felt252,
//   Critical: Array<u64>,
//   Response: Order,
//   Empty,
//   User: UserType,
// }
//

// empty enums
test("makeCustomEnum(null)", () => {
  expect(makeCustomEnum(null)).toBe(undefined)
  expect(makeCustomEnum(undefined as unknown as string)).toBe(undefined)
  expect(makeCustomEnum('')).toBe(undefined)
});
test("parseCustomEnum(null)", () => {
  const empty = { value: undefined, variant: undefined }
  expect(parseCustomEnum(null)).toStrictEqual(empty)
  expect(parseCustomEnum(undefined as unknown as CairoCustomEnum)).toStrictEqual(empty)
  expect(parseCustomEnum('')).toStrictEqual(empty)
});
test("parseEnumVariant(null)", () => {
  expect(parseEnumVariant(null)).toBe(undefined)
  expect(parseEnumVariant(undefined as unknown as CairoCustomEnum)).toBe(undefined)
  expect(parseEnumVariant('')).toBe(undefined)
});

test("CairoCustomEnum(Empty: ())", () => {
  // test starknet example
  const res5 = new CairoCustomEnum({ Empty: {} })
  const a5 = res5.activeVariant(); // "Empty"
  const c5: Object = res5.unwrap(); // {}
  expect(a5).toBe("Empty");
  expect(c5).toStrictEqual({});
  // test makeCustomEnum()
  const made = makeCustomEnum('Empty')
  expect(made?.activeVariant()).toBe(a5)
  expect(made?.unwrap()).toStrictEqual(c5)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res5)
  expect(parsed.variant).toBe(a5)
  expect(parsed.value).toBe(c5)
  // test parseEnumVariant()
  const variant = parseEnumVariant(res5)
  expect(variant).toBe(a5)
});

test("CairoCustomEnum(User: UserType)", () => {
  // test starknet example
  const res6 = new CairoCustomEnum({ User: "Root" })
  const a6 = res6.activeVariant(); // "User"
  const c6: string = res6.unwrap(); // Root
  expect(a6).toBe("User");
  expect(c6).toBe("Root");
  // test makeCustomEnum()
  const made = makeCustomEnum('User', 'Root')
  expect(made?.activeVariant()).toBe(a6)
  expect(made?.unwrap()).toStrictEqual(c6)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res6)
  expect(parsed.variant).toBe(a6)
  expect(parsed.value).toBe(c6)
});


test("CairoCustomEnum(Warning: felt252)", () => {
  // test starknet example
  const res2 = new CairoCustomEnum({ Warning: 7721172739414537047772488609840n })
  const a2 = res2.activeVariant(); // "Warning"
  const c2: bigint = res2.unwrap(); // 7721172739414537047772488609840n
  expect(a2).toBe("Warning");
  expect(c2).toBe(7721172739414537047772488609840n);
  // test makeCustomEnum()
  const made = makeCustomEnum('Warning', 7721172739414537047772488609840n)
  expect(made?.activeVariant()).toBe(a2)
  expect(made?.unwrap()).toBe(bigintToHex(c2))
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res2)
  expect(parsed.variant).toBe(a2)
  expect(parsed.value).toBe(c2)
});

test("CairoCustomEnum(Warning: felt252_hex)", () => {
  // test starknet example
  const res2 = new CairoCustomEnum({ Warning: '0x617474656e74696f6e3a313030' })
  const a2 = res2.activeVariant(); // "Warning"
  const c2: bigint = res2.unwrap(); // 7721172739414537047772488609840n
  expect(a2).toBe("Warning");
  expect(c2).toBe('0x617474656e74696f6e3a313030');
  // test makeCustomEnum()
  const made = makeCustomEnum('Warning', '0x617474656e74696f6e3a313030')
  expect(made?.activeVariant()).toBe(a2)
  expect(made?.unwrap()).toBe(c2)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res2)
  expect(parsed.variant).toBe(a2)
  expect(parsed.value).toBe(c2)
});

test("CairoCustomEnum(Warning: u16)", () => {
  // test starknet example
  const res2 = new CairoCustomEnum({ Warning: 1234 })
  const a2 = res2.activeVariant(); // "Warning"
  const c2: bigint = res2.unwrap(); // 1234
  expect(a2).toBe("Warning");
  expect(c2).toBe(1234);
  // test makeCustomEnum()
  const made = makeCustomEnum('Warning', 1234)
  expect(made?.activeVariant()).toBe(a2)
  expect(made?.unwrap()).toBe(c2)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res2)
  expect(parsed.variant).toBe(a2)
  expect(parsed.value).toBe(c2)
});

test("CairoCustomEnum(Critical: Array<u64>)", () => {
  // test starknet example
  const res3 = new CairoCustomEnum({ Critical: [5n, 6n] })
  const a3 = res3.activeVariant(); // "Critical"
  const c3: bigint[] = res3.unwrap(); // [5n, 6n]
  expect(a3).toBe("Critical");
  expect(c3).toStrictEqual([5n, 6n]);
  // test makeCustomEnum()
  const made = makeCustomEnum('Critical', [5n, 6n])
  expect(made?.activeVariant()).toBe(a3)
  expect(made?.unwrap()).toStrictEqual(c3)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res3)
  expect(parsed.variant).toBe(a3)
  expect(parsed.value).toBe(c3)
});

test("CairoCustomEnum(Critical: Array<felt252_hex>)", () => {
  // test starknet example
  const res3 = new CairoCustomEnum({ Critical: ['0x49339504962090230237950478', '0x617474656e74696f6e3a313031'] })
  const a3 = res3.activeVariant(); // "Critical"
  const c3: bigint[] = res3.unwrap(); // ['0x49339504962090230237950478', '0x617474656e74696f6e3a313031']
  expect(a3).toBe("Critical");
  expect(c3).toStrictEqual(['0x49339504962090230237950478', '0x617474656e74696f6e3a313031']);
  // test makeCustomEnum()
  const made = makeCustomEnum('Critical', ['0x49339504962090230237950478', '0x617474656e74696f6e3a313031'])
  expect(made?.activeVariant()).toBe(a3)
  expect(made?.unwrap()).toStrictEqual(c3)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res3)
  expect(parsed.variant).toBe(a3)
  expect(parsed.value).toBe(c3)
});

test("CairoCustomEnum(Critical: Array<u16>)", () => {
  // test starknet example
  const res3 = new CairoCustomEnum({ Critical: [2, 3] })
  const a3 = res3.activeVariant(); // "Critical"
  const c3: bigint[] = res3.unwrap(); // [2, 3]
  expect(a3).toBe("Critical");
  expect(c3).toStrictEqual([2, 3]);
  // test makeCustomEnum()
  const made = makeCustomEnum('Critical', [2, 3])
  expect(made?.activeVariant()).toBe(a3)
  expect(made?.unwrap()).toStrictEqual(c3)
  // test parseCustomEnum()
  const parsed = parseCustomEnum(res3)
  expect(parsed.variant).toBe(a3)
  expect(parsed.value).toBe(c3)
});

test("CairoCustomEnum(Response: Order)", () => {
  // test starknet example
  type Order = { p1: number, p2: number };
  const orderToSend: Order = { p1: 8, p2: 10 };
  const res4 = new CairoCustomEnum({ Response: orderToSend });
  const a4 = res4.activeVariant(); // "Response"
  const c4: Order = res4.unwrap(); // { p1: 8, p2: 10 }
  expect(a4).toBe("Response");
  expect(c4).toStrictEqual(orderToSend);
  //
  // test makeCustomEnum()
  // !! NOT SUPPORTED YET !!
  //
});

test("CairoCustomEnum(Error: (u16,u16))", () => {
  // test starknet example
  const res = new CairoCustomEnum({ Error: cairo.tuple(100, 110) })
  const a = res.activeVariant(); // "Error"
  const c = res.unwrap(); // {"0": 100, "1": 110}
  expect(a).toBe("Error");
  expect(c).toStrictEqual({ "0": 100, "1": 110 });
  //
  // test makeCustomEnum()
  // !! NOT SUPPORTED YET !!
  //
});

