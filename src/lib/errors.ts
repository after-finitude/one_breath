/**
 * Centralized error logging utility
 * In production, this could be extended to send errors to a monitoring service
 */

type ErrorContext = {
	component?: string;
	action?: string;
	[key: string]: unknown;
};

/**
 * Log an error with optional context
 */
export const logError = (
	message: string,
	error?: unknown,
	context?: ErrorContext,
): void => {
	const errorDetails = {
		message,
		timestamp: new Date().toISOString(),
		...context,
	};

	if (error instanceof Error) {
		console.error(message, {
			...errorDetails,
			errorMessage: error.message,
			stack: error.stack,
		});
	} else if (error) {
		console.error(message, {
			...errorDetails,
			error,
		});
	} else {
		console.error(message, errorDetails);
	}
};

/**
 * Log a warning with optional context
 */
export const logWarning = (message: string, context?: ErrorContext): void => {
	console.warn(message, {
		timestamp: new Date().toISOString(),
		...context,
	});
};

/**
 * Normalize unknown errors to Error instances
 */
export const normalizeError = (
	error: unknown,
	fallbackMessage?: string,
): Error => {
	if (error instanceof Error) {
		return error;
	}

	if (typeof error === "string") {
		return new Error(error);
	}

	return new Error(fallbackMessage ?? "An unknown error occurred");
};
