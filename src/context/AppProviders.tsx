import type { ComponentChildren } from "preact";
import { EntriesProvider } from "./EntriesContext";
import { LanguageProvider } from "./LanguageContext";
import { TimezoneProvider } from "./TimezoneContext";
import { ToastProvider } from "./ToastContext";

export function AppProviders({ children }: { children: ComponentChildren }) {
	return (
		<ToastProvider>
			<LanguageProvider>
				<TimezoneProvider>
					<EntriesProvider>{children}</EntriesProvider>
				</TimezoneProvider>
			</LanguageProvider>
		</ToastProvider>
	);
}
