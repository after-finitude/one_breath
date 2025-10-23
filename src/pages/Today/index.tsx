import type { JSX, TargetedEvent } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { Textarea } from "../../components/ui/textarea";
import { MAX_THOUGHT_LENGTH } from "../../config/constants";
import { useToast } from "../../context";
import { useEntries } from "../../hooks/useEntries";
import { useTranslation } from "../../hooks/useTranslation";
import { getTodayYMD } from "../../lib/date";
import { createSessionDraft } from "../../lib/drafts";
import { logError } from "../../lib/errors";
import { storage } from "../../lib/storage";
import type { Entry } from "../../types/entry";

const DRAFT_KEY = "one-breath-today-draft";
const draft = createSessionDraft(DRAFT_KEY);

export const Today = (): JSX.Element => {
	const { t } = useTranslation();
	const { refresh } = useEntries();
	const toast = useToast();

	const [content, setContent] = useState("");
	const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
	const [entryToReplace, setEntryToReplace] = useState<Omit<
		Entry,
		"id"
	> | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const handleTextareaInput = useCallback(
		(event: TargetedEvent<HTMLTextAreaElement, Event>) => {
			const nextValue = event.currentTarget.value;
			setContent(nextValue);

			if (saveError) {
				setSaveError(null);
			}
		},
		[saveError],
	);

	const resetEntryState = useCallback(() => {
		setEntryToReplace(null);
		setShowReplaceConfirm(false);
	}, []);

	const confirmReplace = useCallback(async () => {
		if (!entryToReplace) {
			return;
		}

		setIsSaving(true);
		setSaveError(null);

		try {
			await storage.replace(entryToReplace);
			await refresh();
			setContent("");
			draft.clear();
			resetEntryState();
			toast.success(t("entry_saved"));
		} catch (error) {
			logError("Failed to replace entry", error, {
				component: "Today",
				action: "replace",
			});
			setSaveError(t("failed_to_save_entry"));
			toast.error(t("failed_to_save_entry"));
		} finally {
			setIsSaving(false);
		}
	}, [entryToReplace, resetEntryState, t, refresh, toast]);

	const cancelReplace = useCallback(() => {
		resetEntryState();
	}, [resetEntryState]);

	const handleSave = useCallback(async () => {
		if (content.trim() === "" || isSaving) {
			return;
		}

		setIsSaving(true);
		setSaveError(null);

		const ymd = getTodayYMD();
		const newEntryData: Omit<Entry, "id"> = {
			ymd,
			content,
			createdAt: new Date().toISOString(),
		};

		try {
			const existingEntry = await storage.get(ymd);

			if (existingEntry) {
				setEntryToReplace(newEntryData);
				setShowReplaceConfirm(true);

				return;
			}

			await storage.put(newEntryData);
			await refresh();
			setContent("");
			draft.clear();
			toast.success(t("entry_saved"));
		} catch (error) {
			logError("Failed to save entry", error, {
				component: "Today",
				action: "save",
			});
			setSaveError(t("failed_to_save_entry"));
			toast.error(t("failed_to_save_entry"));
		} finally {
			setIsSaving(false);
		}
	}, [content, isSaving, t, refresh, toast]);

	// Restore draft on mount
	useEffect(() => {
		const savedDraft = draft.load();
		if (savedDraft.trim()) {
			setContent(savedDraft);
		}
	}, []);

	// Auto-save draft when content changes
	useEffect(() => {
		draft.save(content);
	}, [content]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				handleSave();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleSave]);

	return (
		<div className="mx-auto max-w-2xl space-y-4">
			<h1 className="text-xl font-bold text-black">
				{t("whats_on_your_mind")}
			</h1>

			<div className="space-y-4">
				<Textarea
					value={content}
					onInput={handleTextareaInput}
					maxLength={MAX_THOUGHT_LENGTH}
					placeholder={t("write_your_entry")}
					className="min-h-[300px] resize-none text-base"
				/>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">
						{content.length} / {MAX_THOUGHT_LENGTH}
					</span>
					<Button
						onClick={handleSave}
						disabled={content.trim() === "" || isSaving}
						className="px-6"
						aria-busy={isSaving}
					>
						{t("save")}
					</Button>
				</div>
				{saveError ? (
					<div
						role="alert"
						className="border border-red-300 bg-red-50 p-3 text-sm text-red-800"
					>
						{saveError}
					</div>
				) : null}
			</div>

			<ConfirmDialog
				open={showReplaceConfirm}
				onOpenChange={(open) => {
					if (!open) {
						cancelReplace();
					}
				}}
				onCancel={cancelReplace}
				onConfirm={confirmReplace}
				title={t("replace_thought")}
				description={t("replace_confirm_message")}
				cancelLabel={t("cancel")}
				confirmLabel={t("replace")}
				confirmVariant="destructive"
				confirmDisabled={isSaving}
				cancelDisabled={isSaving}
			/>
		</div>
	);
};
