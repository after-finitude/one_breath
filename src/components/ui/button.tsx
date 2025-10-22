import type { ComponentProps } from "preact";
import { forwardRef } from "preact/compat";

import { cn } from "../../lib/utils";

type ButtonVariant =
	| "default"
	| "destructive"
	| "outline"
	| "secondary"
	| "ghost"
	| "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const BASE_CLASSES =
	"inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-normal focus-visible:outline-none focus-visible:outline-1 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	default: "bg-black text-white hover:bg-gray-700",
	destructive: "bg-black text-white hover:bg-gray-700",
	outline: "border border-black bg-white hover:bg-black hover:text-white",
	secondary: "border border-black bg-white hover:bg-black hover:text-white",
	ghost: "hover:bg-white hover:text-black",
	link: "text-black hover:underline",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
	default: "h-9 px-4 py-2",
	sm: "h-8 px-3 text-xs",
	lg: "h-10 px-8",
	icon: "h-9 w-9",
};

export interface ButtonProps extends Omit<ComponentProps<"button">, "size"> {
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "default",
			size = "default",
			disabled,
			type = "button",
			...props
		},
		ref,
	) => {
		return (
			<button
				type={type}
				className={cn(
					BASE_CLASSES,
					VARIANT_CLASSES[variant],
					SIZE_CLASSES[size],
					className,
				)}
				ref={ref}
				disabled={disabled}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize };
