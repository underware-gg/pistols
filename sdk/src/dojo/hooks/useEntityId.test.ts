import { expect, test } from "vitest";
import { keysToEntityId } from "./useEntityId";

// These guard a claim, not just a function.
//
// Every store-key hook in the client - useChallenge, useSeason, useMatchQueue,
// useMatchPlayer - is safe to call with a nullish key, which is what lets their
// call sites call them unconditionally instead of `cond ? useX(id) : literal`.
// That safety rests entirely on the `BigInt(v ?? 0)` coercion below: a nullish
// key becomes 0, which matches no entity, so the hook returns undefined and its
// own `?? fallback` supplies the value the call site used to substitute.
//
// If that coercion ever changes to throw or to hash undefined distinctly, nine
// call sites in DuelistCard.tsx and SelectDuelistModal.tsx silently break or
// crash, and nothing else in the suite would notice. See
// docs/dependency-reviews/ and the react-hooks/rules-of-hooks fix in 7d52e0e8.

test("keysToEntityId() coerces a nullish key to zero", () => {
  const zero = keysToEntityId([0])
  expect(keysToEntityId([undefined as any])).toBe(zero)
  expect(keysToEntityId([null as any])).toBe(zero)
});

test("keysToEntityId() does not confuse a nullish key with a real one", () => {
  const zero = keysToEntityId([0])
  expect(keysToEntityId([1])).not.toBe(zero)
  expect(keysToEntityId([123])).not.toBe(zero)
  expect(keysToEntityId(['0x7b'])).toBe(keysToEntityId([123]))
});

test("keysToEntityId() coerces a nullish key in any position", () => {
  // The shape useMatchPlayer passes: [playerAddress, getQueueIdValue(queueId)],
  // where getQueueIdValue returns undefined for an unknown queue.
  const address = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8'
  expect(keysToEntityId([address, undefined as any])).toBe(keysToEntityId([address, 0]))
  expect(keysToEntityId([undefined as any, 5])).toBe(keysToEntityId([0, 5]))
  // ...and position is still significant, so this is coercion, not collapsing.
  expect(keysToEntityId([address, undefined as any])).not.toBe(keysToEntityId([undefined as any, address]))
});
