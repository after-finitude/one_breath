import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { Fragment } from "preact";
import type { Toast, ToastType } from "../components/ui/toast";
import { ToastContainer } from "../components/ui/toast";
import { DEFAULT_TOAST_DURATION } from "../config/constants";

type ToastContextValue = {
	showToast: (message: string, type?: ToastType, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
};

const toastsSignal = signal<Toast[]>([]);

function generateToastId(): string {
	return `${Date.now()}-${Math.random()}`;
}

const removeToast = (id: string) => {
	toastsSignal.value = toastsSignal.value.filter((toast) => toast.id !== id);
};

const showToastInternal = (
	message: string,
	type: ToastType = "info",
	duration = DEFAULT_TOAST_DURATION,
) => {
	const id = generateToastId();
	const toast: Toast = { id, message, type, duration };
	toastsSignal.value = [...toastsSignal.value, toast];
};

const successToast = (message: string, duration?: number) => {
	showToastInternal(message, "success", duration);
};

const errorToast = (message: string, duration?: number) => {
	showToastInternal(message, "error", duration);
};

const infoToast = (message: string, duration?: number) => {
	showToastInternal(message, "info", duration);
};

const toastApi: ToastContextValue = {
	showToast: showToastInternal,
	success: successToast,
	error: errorToast,
	info: infoToast,
};

function ToastHost() {
	const toasts = toastsSignal.value;

	return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

export function ToastProvider({ children }: { children: ComponentChildren }) {
	return (
		<Fragment>
			{children}
			<ToastHost />
		</Fragment>
	);
}

export function useToast(): ToastContextValue {
	return toastApi;
}
