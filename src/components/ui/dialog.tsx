import {
	type ComponentChildren,
	createContext,
	type JSX,
	type TargetedMouseEvent,
} from "preact";
import { createPortal, forwardRef } from "preact/compat";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "preact/hooks";
import { cn } from "@/lib/utils";

interface DialogContextValue {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	labelId: string | undefined;
	descriptionId: string | undefined;
	setLabelId: (id?: string) => void;
	setDescriptionId: (id?: string) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

interface DialogProps {
	open?: boolean;
	onOpenChange?: ((open: boolean) => void) | undefined;
	children: ComponentChildren;
}

const isBrowser = typeof document !== "undefined";

const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
	const [labelId, setLabelIdState] = useState<string | undefined>();
	const [descriptionId, setDescriptionIdState] = useState<string | undefined>();

	const setLabelId = useCallback((id?: string) => {
		setLabelIdState(id);
	}, []);

	const setDescriptionId = useCallback((id?: string) => {
		setDescriptionIdState(id);
	}, []);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			onOpenChange?.(next);
		},
		[onOpenChange],
	);

	const value = useMemo<DialogContextValue>(
		() => ({
			open,
			onOpenChange: handleOpenChange,
			labelId,
			descriptionId,
			setLabelId,
			setDescriptionId,
		}),
		[
			open,
			handleOpenChange,
			labelId,
			descriptionId,
			setLabelId,
			setDescriptionId,
		],
	);

	return (
		<DialogContext.Provider value={value}>{children}</DialogContext.Provider>
	);
};

function useDialogContext(): DialogContextValue {
	const context = useContext(DialogContext);

	if (!context) {
		throw new Error("Dialog components must be used within <Dialog>");
	}

	return context;
}

const DialogTrigger = forwardRef<
	HTMLButtonElement,
	JSX.HTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
	const { onOpenChange } = useDialogContext();

	const handleClick = (event: TargetedMouseEvent<HTMLButtonElement>) => {
		onClick?.(event);
		onOpenChange(true);
	};

	return (
		<button ref={ref} className={className} onClick={handleClick} {...props}>
			{children}
		</button>
	);
});
DialogTrigger.displayName = "DialogTrigger";

const DialogPortal = ({ children }: { children: ComponentChildren }) => {
	const { open } = useDialogContext();

	if (!open || !isBrowser) {
		return null;
	}

	return createPortal(children, document.body);
};

const DialogOverlay = forwardRef<
	HTMLDivElement,
	JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			aria-hidden="true"
			className={cn("fixed inset-0 bg-black/55", className)}
			{...props}
		/>
	);
});
DialogOverlay.displayName = "DialogOverlay";

const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	'input[type="text"]:not([disabled])',
	'input[type="radio"]:not([disabled])',
	'input[type="checkbox"]:not([disabled])',
	"select:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(",");

const toId = (
	value?: string | JSX.SignalLike<string | undefined>,
): string | undefined => {
	if (!value) {
		return undefined;
	}

	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "object" && "value" in value) {
		const next = value.value;
		return typeof next === "string" ? next : undefined;
	}

	return undefined;
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
	return Array.from(
		container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
	).filter(
		(element) =>
			!element.hasAttribute("disabled") &&
			element.getAttribute("aria-hidden") !== "true",
	);
};

interface DialogContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
	onClose?: (() => void) | undefined;
}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
	({ className, children, onClose, ...props }, forwardedRef) => {
		const { open, onOpenChange, labelId, descriptionId } = useDialogContext();
		const localRef = useRef<HTMLDivElement | null>(null);
		const setCombinedRef = useCallback(
			(node: HTMLDivElement | null) => {
				localRef.current = node;
				if (!forwardedRef) {
					return;
				}
				if (typeof forwardedRef === "function") {
					forwardedRef(node);
				} else if (typeof forwardedRef === "object") {
					(forwardedRef as { current: HTMLDivElement | null }).current = node;
				}
			},
			[forwardedRef],
		);

		const close = useCallback(() => {
			onOpenChange(false);
			onClose?.();
		}, [onOpenChange, onClose]);

		useEffect(() => {
			if (!open || !isBrowser) {
				return;
			}

			const contentElement = localRef.current;
			if (!contentElement) {
				return;
			}

			const previouslyFocused = document.activeElement as HTMLElement | null;
			const focusable = getFocusableElements(contentElement);
			(focusable[0] ?? contentElement).focus();

			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === "Escape") {
					event.preventDefault();
					close();
					return;
				}

				if (event.key !== "Tab") {
					return;
				}

				const elements = getFocusableElements(contentElement);

				if (elements.length === 0) {
					event.preventDefault();
					contentElement.focus();
					return;
				}

				const activeElement = document.activeElement as HTMLElement | null;
				const currentIndex = activeElement
					? elements.indexOf(activeElement)
					: -1;

				let nextIndex = currentIndex;
				if (event.shiftKey) {
					nextIndex =
						currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
				} else {
					nextIndex =
						currentIndex === -1 || currentIndex === elements.length - 1
							? 0
							: currentIndex + 1;
				}

				elements[nextIndex]?.focus();
				event.preventDefault();
			};

			document.addEventListener("keydown", handleKeyDown, true);

			return () => {
				document.removeEventListener("keydown", handleKeyDown, true);
				if (
					previouslyFocused &&
					typeof previouslyFocused.focus === "function"
				) {
					previouslyFocused.focus();
				}
			};
		}, [close, open]);

		if (!open || !isBrowser) {
			return null;
		}

		const handleOverlayClick = () => {
			close();
		};

		return (
			<DialogPortal>
				<div className="fixed inset-0 z-[100] overflow-y-auto">
					<DialogOverlay onClick={handleOverlayClick} />
					<div className="flex min-h-full items-center justify-center p-4">
						<div
							{...props}
							ref={setCombinedRef}
							role="dialog"
							aria-modal="true"
							aria-labelledby={labelId}
							aria-describedby={descriptionId}
							tabIndex={-1}
							className={cn(
								"relative z-[101] grid w-full max-w-xl gap-6 border border-black bg-white p-8 shadow-lg focus:outline-none",
								className,
							)}
						>
							<button
								type="button"
								onClick={close}
								className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-black"
								aria-label="Close dialog"
							>
								<svg
									aria-hidden="true"
									className="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
							{children}
						</div>
					</div>
				</div>
			</DialogPortal>
		);
	},
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
	className,
	...props
}: JSX.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("flex flex-col space-y-2 text-left", className)}
		{...props}
	/>
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
	className,
	...props
}: JSX.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2",
			className,
		)}
		{...props}
	/>
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef<
	HTMLHeadingElement,
	JSX.HTMLAttributes<HTMLHeadingElement>
>(({ className, id, ...props }, ref) => {
	const { setLabelId } = useDialogContext();
	const generatedId = useMemo(
		() => `dialog-title-${Math.random().toString(36).slice(2, 8)}`,
		[],
	);
	const resolvedId = toId(id) ?? generatedId;

	useEffect(() => {
		setLabelId(resolvedId);
		return () => {
			setLabelId(undefined);
		};
	}, [resolvedId, setLabelId]);

	return (
		<h2
			ref={ref}
			id={resolvedId}
			className={cn("text-xl font-bold leading-tight text-black", className)}
			{...props}
		/>
	);
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
	HTMLParagraphElement,
	JSX.HTMLAttributes<HTMLParagraphElement>
>(({ className, id, ...props }, ref) => {
	const { setDescriptionId } = useDialogContext();
	const generatedId = useMemo(
		() => `dialog-description-${Math.random().toString(36).slice(2, 8)}`,
		[],
	);
	const resolvedId = toId(id) ?? generatedId;

	useEffect(() => {
		setDescriptionId(resolvedId);
		return () => {
			setDescriptionId(undefined);
		};
	}, [resolvedId, setDescriptionId]);

	return (
		<p
			ref={ref}
			id={resolvedId}
			className={cn("text-sm text-gray-600", className)}
			{...props}
		/>
	);
});
DialogDescription.displayName = "DialogDescription";

const DialogClose = forwardRef<
	HTMLButtonElement,
	JSX.HTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
	const { onOpenChange } = useDialogContext();

	const handleClick = (event: TargetedMouseEvent<HTMLButtonElement>) => {
		onClick?.(event);
		onOpenChange(false);
	};

	return (
		<button ref={ref} className={className} onClick={handleClick} {...props}>
			{children}
		</button>
	);
});
DialogClose.displayName = "DialogClose";

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
