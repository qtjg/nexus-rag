import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeLLM } from "./llm";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("NEXUS LLM invocation deadlines", () => {
  it("aborts a deadline-bound request without retrying", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(invokeLLM({
      timeoutMs: 10,
      messages: [{ role: "user", content: "Return a cited answer." }],
    })).rejects.toThrow(/exceeded its 10ms deadline/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
