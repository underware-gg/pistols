import { expect, test } from "vitest";
import { helloPistols } from "./index";

test("helloPistols function", () => {
  expect(helloPistols()).toBe("Bang!");
});
