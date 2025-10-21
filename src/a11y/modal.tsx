import type { ComponentChildren, FunctionalComponent } from "preact";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ComponentChildren;
	title: string;
	descriptionId?: string;
}

const Modal: FunctionalComponent<ModalProps> = ({
	isOpen,
	onClose,
	children,
	title,
	descriptionId,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent onClose={onClose}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{descriptionId && <DialogDescription id={descriptionId} />}
				</DialogHeader>
				<div className="py-4">{children}</div>
			</DialogContent>
		</Dialog>
	);
};

export default Modal;
