import { describe, expect, it } from "vitest";
import { evaluateExpression } from "@/lib/agents/calculator";

describe("evaluateExpression", () => {
  it("handles precedence and parentheses", () => {
    expect(evaluateExpression("2 + 3 * 4")).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
    expect(evaluateExpression("(49 - 18) / 49 * 100")).toBeCloseTo(63.265, 3);
  });

  it("handles power (right-associative) and modulo", () => {
    expect(evaluateExpression("2 ^ 3 ^ 2")).toBe(512);
    expect(evaluateExpression("10 % 3")).toBe(1);
  });

  it("handles unary minus and decimals", () => {
    expect(evaluateExpression("-4 + 10")).toBe(6);
    expect(evaluateExpression("2 * -3")).toBe(-6);
    expect(evaluateExpression("0.1 + 0.2")).toBeCloseTo(0.3);
  });

  it("rejects anything that is not arithmetic — LLM args are untrusted", () => {
    expect(() => evaluateExpression("process.exit(1)")).toThrow();
    expect(() => evaluateExpression("2; DROP TABLE runs")).toThrow();
    expect(() => evaluateExpression("(2 + 3")).toThrow(/parenthes/i);
    expect(() => evaluateExpression("")).toThrow();
  });
});
