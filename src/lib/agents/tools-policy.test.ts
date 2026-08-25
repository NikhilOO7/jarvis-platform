import { describe, expect, it } from "vitest";
import { executeTool, toOpenAITools } from "@/lib/agents/tools";

describe("agent tool policy", () => {
  it("exposes only tools allowlisted for the current step", () => {
    const tools = toOpenAITools(["calculate", "get_current_time"]);
    expect(tools.map((tool) => tool.function.name)).toEqual(["calculate", "get_current_time"]);
  });

  it("rejects a valid tool when the workflow step did not allow it", async () => {
    await expect(executeTool("calculate", '{"expression":"2+2"}', [])).resolves.toEqual({
      ok: false,
      error: "Tool is not allowed in this workflow step: calculate"
    });
  });

  it("executes an allowlisted safe tool", async () => {
    const result = await executeTool("calculate", '{"expression":"2+2"}', ["calculate"]);
    expect(result).toEqual({ ok: true, data: { expression: "2+2", result: 4 } });
  });
});
