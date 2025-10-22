import { Route, Router, Switch } from "wouter-preact";
import { useHashLocation } from "wouter-preact/use-hash-location";
import { Layout } from "../app/Layout";
import { Export } from "../pages/Export";
import { History } from "../pages/History";
import { NotFoundPage } from "../pages/NotFoundPage";
import { Today } from "../pages/Today";

const hashHrefs = (href: string): string => `#${href}`;

export const WouterRouter = () => {
	return (
		<Router hook={useHashLocation} hrefs={hashHrefs}>
			<Layout>
				<Switch>
					<Route path="/">
						<Today />
					</Route>
					<Route path="/history">
						<History />
					</Route>
					<Route path="/export">
						<Export />
					</Route>
					<Route path="/:rest*">
						<NotFoundPage />
					</Route>
				</Switch>
			</Layout>
		</Router>
	);
};
