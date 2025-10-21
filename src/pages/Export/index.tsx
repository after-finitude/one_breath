import type { JSX } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { useMonthOptions } from "../../hooks/useMonthOptions";
import { useTranslation } from "../../hooks/useTranslation";

export const Export = (): JSX.Element => {
	const { t } = useTranslation();
	const { months, entriesByMonth, loading, error } = useMonthOptions();

	const [selectedMonth, setSelectedMonth] = useState<string>("");

	useEffect(() => {
		if (months.length === 0) {
			setSelectedMonth("");

			return;
		}

		setSelectedMonth((prev) => {
			if (prev && months.includes(prev)) {
				return prev;
			}

			return months[0] ?? "";
		});
	}, [months]);

	const entriesToExport = useMemo(() => {
		if (!selectedMonth) {
			return [];
		}

		return entriesByMonth[selectedMonth] ?? [];
	}, [selectedMonth, entriesByMonth]);

	const generateTxtContent = useCallback(() => {
		return entriesToExport
			.map(
				(entry) =>
					`${t("date")}: ${entry.ymd}\n${t("content")}: ${entry.content}\n${t("created")} ${t("at")}: ${new Date(entry.createdAt).toLocaleString()}\n`,
			)
			.join("\n---\n\n");
	}, [entriesToExport, t]);

	const generateMdContent = useCallback(() => {
		return entriesToExport
			.map(
				(entry) =>
					`## ${entry.ymd}\n\n${entry.content}\n\n*${t("created")} ${t("at")}: ${new Date(entry.createdAt).toLocaleString()}*\n`,
			)
			.join("\n---\n\n");
	}, [entriesToExport, t]);

	const downloadFile = useCallback(
		(content: string, filename: string, mimeType: string) => {
			const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		},
		[],
	);

	const handleExportTxt = useCallback(() => {
		const filename = `one-breath-${selectedMonth}.txt`;
		downloadFile(generateTxtContent(), filename, "text/plain");
	}, [selectedMonth, generateTxtContent, downloadFile]);

	const handleExportMd = useCallback(() => {
		const filename = `one-breath-${selectedMonth}.md`;
		downloadFile(generateMdContent(), filename, "text/markdown");
	}, [selectedMonth, generateMdContent, downloadFile]);

	if (loading) {
		return (
			<div className="mx-auto max-w-2xl space-y-4">
				<h1 className="text-xl font-bold text-black">{t("export_thoughts")}</h1>
				<div className="text-center text-sm text-gray-600">
					{t("loading_export_options")}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="mx-auto max-w-2xl space-y-4">
				<h1 className="text-xl font-bold text-black">{t("export_thoughts")}</h1>
				<div className="border border-black bg-white p-4 text-sm text-black">
					{t("failed_to_load_available_months")}
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-4">
			<h1 className="text-xl font-bold text-black">{t("export_thoughts")}</h1>

			<div className="space-y-4">
				<Select
					id="month-select"
					value={selectedMonth}
					onChange={(e) =>
						setSelectedMonth((e.target as HTMLSelectElement).value)
					}
					disabled={months.length === 0}
				>
					{months.length === 0 ? (
						<option value="">{t("no_months_available")}</option>
					) : (
						months.map((month) => (
							<option key={month} value={month}>
								{month}
							</option>
						))
					)}
				</Select>

				{selectedMonth && entriesToExport.length > 0 && (
					<div className="space-y-4">
						<Button onClick={handleExportTxt} className="w-full">
							{t("export_as_txt")}
						</Button>
						<Button
							onClick={handleExportMd}
							variant="outline"
							className="w-full"
						>
							{t("export_as_md")}
						</Button>
					</div>
				)}

				{selectedMonth && entriesToExport.length === 0 && !loading && (
					<p className="text-sm text-gray-600">
						{t("no_entries_for_month")} {selectedMonth}.
					</p>
				)}
			</div>
		</div>
	);
};
