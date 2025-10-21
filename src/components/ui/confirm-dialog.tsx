import type { JSX } from "preact";
import { Button, type ButtonProps } from "./button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./dialog";

type ConfirmDialogProps = {
	open: boolean;
	onOpenChange?: ((open: boolean) => void) | undefined;
	title: string;
	description?: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void | Promise<void>;
	onCancel?: (() => void) | undefined;
	confirmVariant?: ButtonProps["variant"];
	cancelVariant?: ButtonProps["variant"];
	confirmDisabled?: boolean;
	cancelDisabled?: boolean;
};

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onCancel,
	confirmVariant = "default",
	cancelVariant = "outline",
	confirmDisabled = false,
	cancelDisabled = false,
}: ConfirmDialogProps): JSX.Element {
	const handleCancelClick = () => {
		onCancel?.();
		onOpenChange?.(false);
	};

	const handleConfirmClick = () => {
		void onConfirm();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent onClose={onCancel}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>
				<DialogFooter className="flex-row justify-end gap-2 sm:flex-row">
					<Button
						variant={cancelVariant}
						onClick={handleCancelClick}
						disabled={cancelDisabled}
					>
						{cancelLabel}
					</Button>
					<Button
						variant={confirmVariant}
						onClick={handleConfirmClick}
						disabled={confirmDisabled}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
