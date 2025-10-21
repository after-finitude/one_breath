import type { JSX } from "preact";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const BASE_BADGE =
	"inline-flex items-center border px-2.5 py-0.5 text-xs font-bold focus:outline-none";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
	default: "border-transparent bg-black text-white hover:bg-gray-700",
	secondary: "border-transparent bg-gray-100 text-black hover:bg-gray-200",
	destructive: "border-transparent bg-black text-white hover:bg-gray-700",
	outline: "border border-black text-black",
};

export interface BadgeProps extends JSX.HTMLAttributes<HTMLDivElement> {
	variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
	return (
		<div
			className={cn(BASE_BADGE, VARIANT_STYLES[variant], className)}
			{...props}
		/>
	);
}

export { Badge };
export type { BadgeVariant };
