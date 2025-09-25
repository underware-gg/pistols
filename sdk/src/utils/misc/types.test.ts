import { expect, test } from "vitest";
import {
  isStarknetAddress,
  isEthereumAddress,
  bigintToAddress,
  bigintToAddressEth,
  bigintToHex,
  bigintToHex64,
  bigintToHex128,
} from "./types";


test("isStarknetAddress()", () => {
  // starknet addresses
  expect(isStarknetAddress('0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe(true)
  expect(isStarknetAddress('0x0e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe(true)
  expect(isStarknetAddress('0x00e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe(true)
  expect(isStarknetAddress('0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8')).toBe(true)
  // ethereum addresses
  expect(isStarknetAddress('0x5fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe(false)
  expect(isStarknetAddress('0x05fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe(false)
  expect(isStarknetAddress('0x005fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe(false)
  expect(isStarknetAddress('0x8822d811b5749c544e80aad7421fe17555feed29')).toBe(false)
});
test("isEthereumAddress()", () => {
  // starknet addresses
  expect(isEthereumAddress('0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe(false)
  expect(isEthereumAddress('0x0e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe(false)
  expect(isEthereumAddress('0x00e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe(false)
  expect(isEthereumAddress('0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8')).toBe(false)
  // ethereum addresses
  expect(isEthereumAddress('0x5fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe(true)
  expect(isEthereumAddress('0x05fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe(true)
  expect(isEthereumAddress('0x005fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe(true)
  expect(isEthereumAddress('0x8822d811b5749c544e80aad7421fe17555feed29')).toBe(true)
});
test("bigintToHex()", () => {
  expect(bigintToHex(1)).toBe('0x1')
  expect(bigintToHex(BigInt(1))).toBe('0x1')
  expect(bigintToHex('1')).toBe('0x1')
  expect(bigintToHex('0x1')).toBe('0x1')
});
test("bigintToHex64()", () => {
  expect(bigintToHex64(1)).toBe('0x0000000000000001')
  expect(bigintToHex64(BigInt(1))).toBe('0x0000000000000001')
  expect(bigintToHex64('1')).toBe('0x0000000000000001')
  expect(bigintToHex64('0x1')).toBe('0x0000000000000001')
});
test("bigintToHex128()", () => {
  expect(bigintToHex128(1)).toBe('0x00000000000000000000000000000001')
  expect(bigintToHex128(BigInt(1))).toBe('0x00000000000000000000000000000001')
  expect(bigintToHex128('1')).toBe('0x00000000000000000000000000000001')
  expect(bigintToHex128('0x1')).toBe('0x00000000000000000000000000000001')
});
test("bigintToAddress()", () => {
  expect(bigintToAddress('0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe('0x00e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')
  expect(bigintToAddress('0x0e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe('0x00e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')
  expect(bigintToAddress('0x00e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')).toBe('0x00e29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a')
});
test("bigintToAddressEth()", () => {
  expect(bigintToAddressEth('0x5fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe('0x005fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')
  expect(bigintToAddressEth('0x05fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe('0x005fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')
  expect(bigintToAddressEth('0x005fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')).toBe('0x005fae26ee1a7f27201bf8e23173ac1c2f9a0c7d')
});
