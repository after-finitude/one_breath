#!/usr/bin/env bun

import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import tailwindPostcss from "@tailwindcss/postcss";
import postcss from "postcss";

const DOCS_DIR = "docs";
const ASSETS_DIR = join(DOCS_DIR, "assets");
const CLIENT_ENTRY = "src/client.tsx";
const GLOBAL_STYLES_ENTRY = "src/styles/globals.css";
const INDEX_TEMPLATE = "index.html";

async function prepareOutputDirectory() {
	await mkdir(DOCS_DIR, { recursive: true });
	await rm(ASSETS_DIR, { recursive: true, force: true });
	await mkdir(ASSETS_DIR, { recursive: true });
}

async function buildClientBundle() {
	const result = await Bun.build({
		entrypoints: [CLIENT_ENTRY],
		outdir: ASSETS_DIR,
		minify: true,
		format: "esm",
		target: "browser",
		splitting: false,
	});

	if (!result.success) {
		throw new Error("Failed to build client bundle");
	}
}

async function buildGlobalStyles() {
	const source = await Bun.file(GLOBAL_STYLES_ENTRY).text();
	const result = await postcss([tailwindPostcss()]).process(source, {
		from: GLOBAL_STYLES_ENTRY,
	});

	await Bun.write(join(ASSETS_DIR, "globals.css"), result.css);
}

async function copyIndexTemplate() {
	const template = await Bun.file(INDEX_TEMPLATE).text();
	await Bun.write(join(DOCS_DIR, "index.html"), template);
}

async function writeNoJekyllFile() {
	await Bun.write(join(DOCS_DIR, ".nojekyll"), "");
}

async function buildStaticSite() {
	await prepareOutputDirectory();
	await Promise.all([buildClientBundle(), buildGlobalStyles()]);
	await Promise.all([copyIndexTemplate(), writeNoJekyllFile()]);
}

void buildStaticSite()
	.then(() => {
		console.log("Static site built in docs/");
	})
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
