import { render } from "preact";
import { Layout } from "./app/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppProviders } from "./context";
import { logError } from "./lib/errors";
import { WouterRouter } from "./router/WouterRouter";

function App() {
	return (
		<ErrorBoundary>
			<AppProviders>
				<Layout>
					<WouterRouter />
				</Layout>
			</AppProviders>
		</ErrorBoundary>
	);
}

const app = document.getElementById("app");

if (app) {
	render(<App />, app);
} else {
	logError("Failed to find app element", undefined, { component: "client" });
}
