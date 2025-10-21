import { Link } from "wouter-preact";
import { useTranslation } from "../../hooks/useTranslation";

export const NotFoundPage = () => {
	const { t } = useTranslation();

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
			<h1 className="text-2xl font-bold text-black">{t("page_not_found")}</h1>
			<Link
				href="/"
				className="border border-black bg-white px-4 py-2 text-black hover:bg-black hover:text-white"
			>
				{t("go_to_home")}
			</Link>
		</div>
	);
};
