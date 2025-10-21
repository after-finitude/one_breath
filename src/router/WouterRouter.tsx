import { Route, Router, Switch } from "wouter-preact";
import { Export } from "../pages/Export";
import { History } from "../pages/History";
import { NotFoundPage } from "../pages/NotFoundPage";
import { Today } from "../pages/Today";

export const WouterRouter = () => {
	return (
		<Router>
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
		</Router>
	);
};
