import type { JSX } from "preact";
import { useEffect } from "preact/hooks";

export type ToastType = "success" | "error" | "info";

export type Toast = {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
};

type ToastProps = {
	toast: Toast;
	onClose: (id: string) => void;
};

function ToastItem({ toast, onClose }: ToastProps): JSX.Element {
	useEffect(() => {
		const duration = toast.duration ?? 3000;
		const timer = setTimeout(() => {
			onClose(toast.id);
		}, duration);

		return () => clearTimeout(timer);
	}, [toast.id, toast.duration, onClose]);

	return (
		<div
			className="pointer-events-auto mb-2 flex items-center justify-between rounded border border-black bg-white px-4 py-3 text-black shadow-lg"
			role="alert"
		>
			<span className="text-sm">{toast.message}</span>
			<button
				type="button"
				onClick={() => onClose(toast.id)}
				className="ml-4 text-lg leading-none opacity-70 hover:opacity-100"
				aria-label="Close"
			>
				×
			</button>
		</div>
	);
}

type ToastContainerProps = {
	toasts: Toast[];
	onClose: (id: string) => void;
};

export function ToastContainer({
	toasts,
	onClose,
}: ToastContainerProps): JSX.Element {
	return (
		<div className="pointer-events-none fixed left-1/2 top-4 z-50 flex w-full max-w-md -translate-x-1/2 flex-col px-4">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onClose={onClose} />
			))}
		</div>
	);
}
