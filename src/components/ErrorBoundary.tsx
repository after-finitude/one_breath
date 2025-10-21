import type { ComponentChildren, JSX } from "preact";
import { Component } from "preact";

interface ErrorBoundaryProps {
	children: ComponentChildren;
	fallback?: (error: Error, reset: () => void) => JSX.Element;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static override getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	override componentDidCatch(
		error: Error,
		errorInfo: { componentStack?: string },
	) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	resetError = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.resetError);
			}

			return (
				<div className="flex min-h-screen items-center justify-center bg-white p-4">
					<div className="w-full max-w-md space-y-4">
						<div className="space-y-2">
							<h1 className="text-2xl font-bold text-black">
								Something went wrong
							</h1>
							<p className="text-sm text-gray-600">
								An unexpected error occurred. Please try refreshing the page.
							</p>
						</div>

						{this.state.error.message && (
							<div className="border border-red-300 bg-red-50 p-4">
								<p className="text-sm font-mono text-red-800">
									{this.state.error.message}
								</p>
							</div>
						)}

						<div className="flex gap-2">
							<button
								type="button"
								onClick={this.resetError}
								className="rounded border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
							>
								Try again
							</button>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
							>
								Reload page
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
