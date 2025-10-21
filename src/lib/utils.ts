import { twMerge } from "tailwind-merge";

type ClassValue = unknown;

function toClassList(value: ClassValue): string[] {
	if (value === null || value === undefined || value === false) {
		return [];
	}

	if (Array.isArray(value)) {
		return value.flatMap(toClassList);
	}

	if (typeof value === "function") {
		try {
			return toClassList(value());
		} catch {
			return [];
		}
	}

	if (typeof value === "object") {
		if (!value) return [];
		if ("value" in value) {
			return toClassList((value as { value?: unknown }).value as ClassValue);
		}
		return Object.entries(value as Record<string, boolean>)
			.filter(([, enabled]) => Boolean(enabled))
			.map(([key]) => key);
	}

	if (value === true) {
		return [];
	}

	return [`${value}`];
}

export function cn(...inputs: ClassValue[]): string {
	const classes = inputs
		.flatMap(toClassList)
		.filter((value) => value.length > 0);
	return twMerge(classes.join(" "));
}
