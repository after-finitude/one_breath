import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface ErrorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onReset: () => void;
}

export const ErrorModal = ({ isOpen, onClose, onReset }: ErrorModalProps) => {
	const { t } = useTranslation();

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent onClose={onClose}>
				<DialogHeader>
					<DialogTitle>{t("corrupted_data")}</DialogTitle>
					<DialogDescription>
						{t("corrupted_data_description")}
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<p className="text-sm font-bold text-black border border-black bg-white p-4">
						<strong>{t("warning")}:</strong> {t("reset_warning")}
					</p>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						{t("close")}
					</Button>
					<Button variant="destructive" onClick={onReset}>
						{t("reset_data")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
