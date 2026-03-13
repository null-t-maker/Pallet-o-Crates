import { describe, expect, it, vi } from "vitest";
import {
  createPackingProgressReporter,
  isPackingCancelledError,
  PackingCancelledError,
} from "../packingProgress";

describe("createPackingProgressReporter", () => {
  it("throws a cancellation error when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const onProgress = vi.fn();
    const reporter = createPackingProgressReporter({
      kind: "calculate",
      requestedUnits: 10,
      onProgress,
      signal: controller.signal,
    });

    await expect(reporter.report({
      stage: "preparing",
      packedUnits: 0,
    })).rejects.toBeInstanceOf(PackingCancelledError);
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("stops reporting after cancellation is requested", async () => {
    const controller = new AbortController();
    const onProgress = vi.fn();
    const reporter = createPackingProgressReporter({
      kind: "calculateMissing",
      requestedUnits: 12,
      onProgress,
      signal: controller.signal,
    });

    await reporter.report({
      stage: "preparing",
      packedUnits: 0,
    }, { force: true });
    controller.abort();

    let thrown: unknown = null;
    try {
      reporter.throwIfCancelled();
    } catch (error) {
      thrown = error;
    }

    expect(isPackingCancelledError(thrown)).toBe(true);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });
});
