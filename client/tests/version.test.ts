import { expect, test } from "vitest";
import { PACKAGE_VERSION } from "../src/utils/constants";
import { getVersion } from "@underware/pistols-sdk";

test("PACKAGE_VERSION", () => {
  expect(PACKAGE_VERSION).not.toBeNull();
  expect(PACKAGE_VERSION.split('.').length).toBe(3);
});

test("SDK version", () => {
  expect(getVersion()).toBe(PACKAGE_VERSION);
});
