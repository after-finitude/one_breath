import type { FunctionalComponent, JSX } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Modal from "../../a11y/modal";
import { Button } from "../../components/ui/button";
import { ENTRIES_PER_PAGE, PREVIEW_LENGTH } from "../../config/constants";
import { useEntries } from "../../hooks/useEntries";
import { useTranslation } from "../../hooks/useTranslation";
import type { Entry } from "../../types/entry";

interface HistoryEntryProps {
	entry: Entry;
	onClick: (entry: Entry) => void;
}

const HistoryEntry: FunctionalComponent<HistoryEntryProps> = ({
	entry,
	onClick,
}) => {
	return (
		<button
			type="button"
			className="w-full cursor-pointer border-b border-black px-4 py-4 text-left hover:bg-white"
			onClick={() => onClick(entry)}
		>
			<div className="space-y-1">
				<div className="text-sm font-bold text-black">{entry.ymd}</div>
				<div className="line-clamp-2 text-sm text-gray-600">
					{entry.content.substring(0, PREVIEW_LENGTH)}...
				</div>
			</div>
		</button>
	);
};

export const History = (): JSX.Element => {
	const { t } = useTranslation();
	const { entries, loading, error } = useEntries();

	const [displayedEntries, setDisplayedEntries] = useState<Entry[]>([]);
	const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const activeEntries = useMemo(() => {
		return entries
			.filter((entry) => !entry.replacedAt)
			.sort((a, b) => new Date(b.ymd).getTime() - new Date(a.ymd).getTime());
	}, [entries]);

	useEffect(() => {
		if (error) {
			setErrorMessage(t("failed_to_load_history"));
		} else {
			setErrorMessage(null);
		}
	}, [error, t]);

	useEffect(() => {
		if (activeEntries.length === 0) {
			setDisplayedEntries([]);

			return;
		}

		setDisplayedEntries(activeEntries.slice(0, ENTRIES_PER_PAGE));
	}, [activeEntries]);

	const hasMore = displayedEntries.length < activeEntries.length;

	const loadMoreEntries = useCallback(() => {
		setDisplayedEntries((prev) => {
			const nextChunk = activeEntries.slice(
				prev.length,
				prev.length + ENTRIES_PER_PAGE,
			);

			if (nextChunk.length === 0) {
				return prev;
			}

			return [...prev, ...nextChunk];
		});
	}, [activeEntries]);

	const handleEntryClick = (entry: Entry) => {
		setSelectedEntry(entry);
	};

	const handleCloseModal = () => {
		setSelectedEntry(null);
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-2xl space-y-4">
				<h1 className="text-xl font-bold text-black">{t("history")}</h1>
				<div className="text-center text-sm text-gray-600">
					{t("loading_history")}
				</div>
			</div>
		);
	}

	if (errorMessage) {
		return (
			<div className="mx-auto max-w-2xl space-y-4">
				<h1 className="text-xl font-bold text-black">{t("history")}</h1>
				<div className="border border-black bg-white p-4 text-sm text-black">
					{errorMessage}
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-4">
			<h1 className="text-xl font-bold text-black">{t("history")}</h1>
			<div className="border border-black">
				{displayedEntries.length === 0 ? (
					<div className="py-12 text-center text-sm text-gray-600">
						{t("no_entries_yet")}
					</div>
				) : (
					displayedEntries.map((entry) => (
						<HistoryEntry
							key={entry.id}
							entry={entry}
							onClick={handleEntryClick}
						/>
					))
				)}
			</div>
			{hasMore && (
				<div className="flex justify-center">
					<Button
						variant="outline"
						onClick={loadMoreEntries}
						disabled={loading}
					>
						{t("load_more")}
					</Button>
				</div>
			)}

			<Modal
				isOpen={!!selectedEntry}
				onClose={handleCloseModal}
				title={selectedEntry?.ymd || ""}
			>
				{selectedEntry && (
					<div className="space-y-4 text-left">
						<p className="whitespace-pre-wrap text-base leading-relaxed text-black">
							{selectedEntry.content}
						</p>
						<div className="border border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
							{t("created")}:{" "}
							<span className="font-bold normal-case text-black">
								{new Date(selectedEntry.createdAt).toLocaleString()}
							</span>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
};
