import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useCallback, useContext, useMemo, useState } from "preact/hooks";
import type { Toast, ToastType } from "../components/ui/toast";
import { ToastContainer } from "../components/ui/toast";

type ToastContextValue = {
	showToast: (message: string, type?: ToastType, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ComponentChildren }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info", duration = 3000) => {
			const id = `${Date.now()}-${Math.random()}`;
			const toast: Toast = { id, message, type, duration };
			setToasts((prev) => [...prev, toast]);
		},
		[],
	);

	const success = useCallback(
		(message: string, duration?: number) => {
			showToast(message, "success", duration);
		},
		[showToast],
	);

	const error = useCallback(
		(message: string, duration?: number) => {
			showToast(message, "error", duration);
		},
		[showToast],
	);

	const info = useCallback(
		(message: string, duration?: number) => {
			showToast(message, "info", duration);
		},
		[showToast],
	);

	const value = useMemo(
		() => ({
			showToast,
			success,
			error,
			info,
		}),
		[showToast, success, error, info],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toasts} onClose={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}

	return context;
}
