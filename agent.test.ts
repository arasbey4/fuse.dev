import { describe, expect, it } from "vitest";
import { AgentRun } from "./index";

describe("AgentRun", () => {
  it("records valid state transitions", () => {
    const run = new AgentRun("Fix tests", {
      maxIterations: 3,
      maxToolCalls: 5,
      timeoutMs: 10_000,
    });

    run.transition("PLANNING", "Creating plan");
    run.transition("EXECUTING", "Running first tool");
    run.transition("OBSERVING", "Inspecting output");
    run.transition("COMPLETED", "Done");

    expect(run.state).toBe("COMPLETED");
    expect(run.events).toHaveLength(4);
  });

  it("rejects invalid transitions", () => {
    const run = new AgentRun("Skip to done", {
      maxIterations: 3,
      maxToolCalls: 5,
      timeoutMs: 10_000,
    });

    expect(() => run.transition("COMPLETED", "Nope")).toThrow(/invalid agent transition/i);
  });
});
