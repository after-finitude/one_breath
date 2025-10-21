#!/usr/bin/env bun

import { join } from "node:path";

const DOCS_DIR = "docs";
const DEFAULT_PORT = Number(process.env.PORT ?? 4173);

const resolvePath = (pathname: string) => {
	const normalized = pathname.startsWith("/")
		? pathname.substring(1)
		: pathname;

	return join(DOCS_DIR, normalized);
};

const serveFile = async (pathname: string) => {
	const file = Bun.file(resolvePath(pathname));

	if (!(await file.exists())) {
		return null;
	}

	const contentType = file.type || "application/octet-stream";

	return new Response(file, {
		headers: {
			"Content-Type": contentType,
		},
	});
};

const fallbackToIndex = async () => {
	const file = Bun.file(join(DOCS_DIR, "index.html"));

	if (!(await file.exists())) {
		return new Response("Build the site with `bun run build` first.", {
			status: 404,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		});
	}

	return new Response(file, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
		},
	});
};

const server = Bun.serve({
	port: DEFAULT_PORT,
	async fetch(request) {
		const url = new URL(request.url);
		const { pathname } = url;

		if (pathname === "/") {
			const home = await serveFile("index.html");

			if (home) {
				return home;
			}
		} else {
			const asset = await serveFile(pathname);

			if (asset) {
				return asset;
			}
		}

		return fallbackToIndex();
	},
});

console.log(`Preview server running at http://localhost:${server.port}`);

// Keep the process alive.
await new Promise(() => {});
