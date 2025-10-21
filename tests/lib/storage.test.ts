import { afterEach, describe, expect, it } from "bun:test";
import { storage } from "../../src/lib/storage";
import type { Entry } from "../../src/types/entry";

const baseEntry = {
	ymd: "2025-01-15",
	content: "First thought of the day",
	createdAt: "2025-01-15T08:00:00.000Z",
} as const;

afterEach(async () => {
	await storage.admin.clear();
});

describe("storage", () => {
	it("creates and retrieves entries", async () => {
		const created = await storage.put(baseEntry);

		expect(created.id).toBeString();
		expect(created.replacedAt).toBeNull();

		const fetched = await storage.get(baseEntry.ymd);
		expect(fetched).not.toBeNull();
		expect(fetched?.content).toBe(baseEntry.content);

		const all = await storage.getAll();
		expect(all).toHaveLength(1);
		expect(all[0]?.id).toBe(created.id);
	});

	it("replaces an existing entry and keeps history", async () => {
		await storage.put(baseEntry);

		const replacement = await storage.replace({
			ymd: baseEntry.ymd,
			content: "Updated thought",
			createdAt: "2025-01-15T20:00:00.000Z",
		});

		expect(replacement.id).toBeString();
		expect(replacement.replacedAt).toBeNull();
		expect(replacement.content).toBe("Updated thought");

		const current = await storage.get(baseEntry.ymd);
		expect(current?.id).toBe(replacement.id);

		const all = await storage.getAll();
		expect(all).toHaveLength(2);

		const previous = all.find((entry) => entry.id !== replacement.id);
		expect(previous?.replacedAt).not.toBeNull();
	});

	it("reads and writes full records via admin helpers", async () => {
		const historic: Entry = {
			id: "legacy-entry",
			ymd: baseEntry.ymd,
			content: "Earlier idea",
			createdAt: "2025-01-15T06:00:00.000Z",
			replacedAt: null,
		};

		await storage.admin.writeRecord({
			ymd: baseEntry.ymd,
			entries: [historic],
		});

		const record = await storage.admin.readRecord(baseEntry.ymd);
		expect(record).not.toBeNull();
		expect(record?.entries).toHaveLength(1);
		expect(record?.entries[0]?.id).toBe("legacy-entry");

		await storage.admin.deleteRecord(baseEntry.ymd);

		const missing = await storage.admin.readRecord(baseEntry.ymd);
		expect(missing).toBeNull();
	});
});
