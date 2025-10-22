import {
	DEFAULT_BACKOFF_FACTOR,
	DEFAULT_INITIAL_DELAY,
	DEFAULT_MAX_ATTEMPTS,
	DEFAULT_MAX_DELAY,
} from "../config/constants";

export type RetryOptions = {
	maxAttempts?: number;
	initialDelay?: number;
	maxDelay?: number;
	backoffFactor?: number;
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const {
		maxAttempts = DEFAULT_MAX_ATTEMPTS,
		initialDelay = DEFAULT_INITIAL_DELAY,
		maxDelay = DEFAULT_MAX_DELAY,
		backoffFactor = DEFAULT_BACKOFF_FACTOR,
	} = options;

	let lastError: Error = new Error("Unknown error");
	let delay = initialDelay;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt === maxAttempts) {
				throw lastError;
			}

			await new Promise((resolve) => setTimeout(resolve, delay));
			delay = Math.min(delay * backoffFactor, maxDelay);
		}
	}

	throw lastError;
}
