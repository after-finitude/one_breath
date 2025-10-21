import type { JSX } from "preact";
import { Link, useLocation } from "wouter-preact";
import { useLanguage } from "@/context";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export const Navigation = (): JSX.Element => {
	const [currentPath] = useLocation();
	const { t } = useTranslation();
	const { language, toggleLanguage } = useLanguage();

	const links = [
		{ href: "/", label: t("today") },
		{ href: "/history", label: t("history") },
		{ href: "/export", label: t("export") },
	];

	return (
		<nav className="border-b border-black bg-white">
			<div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
				<span className="text-lg font-bold text-black">{t("app_title")}</span>
				<div className="flex items-center gap-4">
					<div className="hidden items-center gap-4 sm:flex">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={cn(
									"text-sm",
									currentPath === link.href
										? "font-bold text-black"
										: "text-gray-600 hover:text-black",
								)}
							>
								{link.label}
							</Link>
						))}
					</div>
					<button
						type="button"
						onClick={toggleLanguage}
						className="text-base"
						aria-label={`Switch to ${language === "en" ? "Русский" : "English"}`}
						title={`Switch to ${language === "en" ? "Русский" : "English"}`}
					>
						{language === "en" ? "🇬🇧" : "🇷🇺"}
					</button>
				</div>
			</div>
			<div className="flex justify-center gap-4 border-t border-black px-4 py-3 sm:hidden">
				{links.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className={cn(
							"text-sm",
							currentPath === link.href
								? "font-bold text-black"
								: "text-gray-600 hover:text-black",
						)}
					>
						{link.label}
					</Link>
				))}
			</div>
		</nav>
	);
};
