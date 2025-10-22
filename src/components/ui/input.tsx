import type { ComponentProps } from "preact";
import { forwardRef } from "preact/compat";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
	type?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-9 w-full border border-black bg-white px-3 py-1 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black placeholder:text-gray-600 focus-visible:outline-none focus-visible:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
