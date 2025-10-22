import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createSessionDraft } from "../../src/lib/drafts";

const storageMap = new Map<string, string>();

const sessionStorageMock = {
	getItem: (key: string) => storageMap.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storageMap.set(key, value);
	},
	removeItem: (key: string) => {
		storageMap.delete(key);
	},
};

const originalWindow = globalThis.window;

beforeEach(() => {
	storageMap.clear();
	// @ts-expect-error - minimal window stub for tests
	globalThis.window = { sessionStorage: sessionStorageMock };
});

afterEach(() => {
	if (originalWindow) {
		globalThis.window = originalWindow;
	} else {
		// @ts-expect-error - allow cleanup when original window was undefined
		delete globalThis.window;
	}
});

describe("createSessionDraft", () => {
	it("persists and retrieves drafts", () => {
		const draft = createSessionDraft("test");

		expect(draft.load()).toBe("");

		draft.save("hello world");
		expect(draft.load()).toBe("hello world");
	});

	it("removes drafts when saving blank content", () => {
		const draft = createSessionDraft("test");

		draft.save("keep me");
		expect(draft.load()).toBe("keep me");

		draft.save("   ");
		expect(draft.load()).toBe("");
	});

	it("clears stored drafts", () => {
		const draft = createSessionDraft("test");

		draft.save("keep me");
		expect(draft.load()).toBe("keep me");

		draft.clear();
		expect(draft.load()).toBe("");
	});
});
