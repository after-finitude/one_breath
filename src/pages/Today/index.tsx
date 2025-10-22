import type { JSX } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { Textarea } from "../../components/ui/textarea";
import { MAX_THOUGHT_LENGTH } from "../../config/constants";
import { useEntries } from "../../hooks/useEntries";
import { useTranslation } from "../../hooks/useTranslation";
import { getTodayYMD } from "../../lib/date";
import { logError } from "../../lib/errors";
import { storage } from "../../lib/storage";
import type { Entry } from "../../types/entry";

const DRAFT_KEY = "one-breath-today-draft";

export const Today = (): JSX.Element => {
	const { t } = useTranslation();
	const { refresh } = useEntries();

	const [content, setContent] = useState("");
	const [_draftRestored, setDraftRestored] = useState(false);
	const [charCount, setCharCount] = useState(0);
	const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
	const [entryToReplace, setEntryToReplace] = useState<Omit<
		Entry,
		"id"
	> | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const handleTextareaInput = useCallback(
		(event: Event) => {
			const nextValue = (event.target as HTMLTextAreaElement).value;
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
			// Clear draft after successful save
			try {
				sessionStorage.removeItem(DRAFT_KEY);
			} catch {
				// Ignore errors
			}
			resetEntryState();
		} catch (error) {
			logError("Failed to replace entry", error, {
				component: "Today",
				action: "replace",
			});
			setSaveError(t("failed_to_save_entry"));
		} finally {
			setIsSaving(false);
		}
	}, [entryToReplace, resetEntryState, t, refresh]);

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
			// Clear draft after successful save
			try {
				sessionStorage.removeItem(DRAFT_KEY);
			} catch {
				// Ignore errors
			}
		} catch (error) {
			logError("Failed to save entry", error, {
				component: "Today",
				action: "save",
			});
			setSaveError(t("failed_to_save_entry"));
		} finally {
			setIsSaving(false);
		}
	}, [content, isSaving, t, refresh]);

	// Restore draft on mount
	useEffect(() => {
		try {
			const savedDraft = sessionStorage.getItem(DRAFT_KEY);
			if (savedDraft?.trim()) {
				setContent(savedDraft);
				setDraftRestored(true);
			}
		} catch (_error) {
			// Ignore errors (e.g., sessionStorage not available)
		}
	}, []);

	// Auto-save draft when content changes
	useEffect(() => {
		try {
			if (content.trim()) {
				sessionStorage.setItem(DRAFT_KEY, content);
			} else {
				sessionStorage.removeItem(DRAFT_KEY);
			}
		} catch (_error) {
			// Ignore errors (e.g., sessionStorage not available or quota exceeded)
		}
	}, [content]);

	useEffect(() => {
		setCharCount(content.length);
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
					placeholder={t("whats_on_your_mind")}
					className="min-h-[300px] resize-none text-base"
				/>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">
						{charCount} / {MAX_THOUGHT_LENGTH}
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
