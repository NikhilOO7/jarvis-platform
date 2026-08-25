import { describe, expect, it } from "vitest";
import { routeCommand } from "@/lib/command-router";

describe("keyword command routing", () => {
  it("keeps unmatched commands in the safe local utility workflow", () => {
    const route = routeCommand("hello there");
    expect(route.workflow.key).toBe("telegram_voice_command_router");
    expect(route.approvalRequired).toBe(false);
  });

  it("routes explicit calculations to the utility workflow", () => {
    const route = routeCommand("calculate 49 minus 18");
    expect(route.agentKind).toBe("CALCULATOR");
    expect(route.workflow.key).toBe("telegram_voice_command_router");
  });
});
