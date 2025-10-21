import type { ComponentChildren } from "preact";
import { Navigation } from "../components/Navigation";

interface LayoutProps {
	children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
	return (
		<div className="min-h-screen bg-white">
			<Navigation />
			<main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
				{children}
			</main>
		</div>
	);
}
