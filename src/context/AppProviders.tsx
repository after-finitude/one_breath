import type { ComponentChildren } from "preact";
import { EntriesProvider } from "./EntriesContext";
import { LanguageProvider } from "./LanguageContext";
import { TimezoneProvider } from "./TimezoneContext";

export function AppProviders({ children }: { children: ComponentChildren }) {
	return (
		<LanguageProvider>
			<TimezoneProvider>
				<EntriesProvider>{children}</EntriesProvider>
			</TimezoneProvider>
		</LanguageProvider>
	);
}
