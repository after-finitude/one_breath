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
		maxAttempts = 3,
		initialDelay = 100,
		maxDelay = 2000,
		backoffFactor = 2,
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
