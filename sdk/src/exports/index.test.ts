import { expect, test } from "vitest";
import { getVersion, helloPistols } from "./index";

test("getVersion()", () => {
  expect(getVersion()).not.toBeNull();
  expect(getVersion().split('.').length).toBe(3);
});

test("helloPistols()", () => {
  expect(helloPistols()).toBe("Bang!");
});
