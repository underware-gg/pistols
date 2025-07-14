import { expect, test } from "vitest";
import { make_moves_hash, restore_moves_from_hash } from "./moves_hash";

test("hash_uniqueness", () => {
  const salt_1 = BigInt(1);
  const salt_2 = BigInt(2);
  const moves_1 = [1, 2, 3, 4];
  const moves_2 = [1, 2, 3, 3];
  const hash_1_1 = make_moves_hash(salt_1, moves_1);
  const hash_1_2 = make_moves_hash(salt_1, moves_2);
  const hash_2_1 = make_moves_hash(salt_2, moves_1);
  const hash_2_2 = make_moves_hash(salt_2, moves_2);
  expect(hash_1_1).not.toBe(BigInt(0));
  expect(hash_1_2).not.toBe(BigInt(0));
  expect(hash_2_1).not.toBe(BigInt(0));
  expect(hash_2_2).not.toBe(BigInt(0));
  expect(hash_1_1).not.toBe(hash_1_2);
  expect(hash_1_1).not.toBe(hash_2_1);
  expect(hash_1_1).not.toBe(hash_2_2);
  expect(hash_1_2).not.toBe(hash_2_1);
  expect(hash_1_2).not.toBe(hash_2_2);
  expect(hash_2_1).not.toBe(hash_2_2);
  // empty
  expect(make_moves_hash(salt_1, [])).toBe(BigInt(0));
  expect(make_moves_hash(salt_1, [0, 0, 0, 0])).toBe(BigInt(0));
});

const _test_deck = () => {
  return[
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  ];
}

test("hash_restore", () => {
  const deck = _test_deck();
  const salt = BigInt(1);
  const moves_1 = [1, 2, 3, 4];
  const moves_2 = [5, 4, 3, 2];
  const hash_1 = make_moves_hash(salt, moves_1);
  const hash_2 = make_moves_hash(salt, moves_2);
  // restore...
  expect(restore_moves_from_hash(salt, hash_1, deck)).toEqual(moves_1);
  expect(restore_moves_from_hash(salt, hash_2, deck)).toEqual(moves_2);
});

