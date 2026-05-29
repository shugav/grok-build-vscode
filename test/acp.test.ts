import { describe, expect, it } from "vitest";
import { buildGrokAgentArgs } from "../src/acp";

describe("buildGrokAgentArgs", () => {
  it("starts ACP sessions with the stdio subcommand", () => {
    expect(buildGrokAgentArgs()).toEqual(["agent", "stdio"]);
  });

  it("does not forward defaultEffort to grok-build ACP startup", () => {
    expect(buildGrokAgentArgs("max")).toEqual(["agent", "stdio"]);
  });
});
