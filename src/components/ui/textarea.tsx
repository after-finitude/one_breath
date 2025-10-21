import type { JSX } from "preact";
import { forwardRef } from "preact/compat";
import { cn } from "@/lib/utils";

export interface TextareaProps extends JSX.HTMLAttributes<HTMLTextAreaElement> {
	value?: string;
	onInput?: (event: Event) => void;
	maxLength?: number;
	placeholder?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, value, onInput, maxLength, placeholder, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[60px] w-full border border-black bg-white px-3 py-2 text-base placeholder:text-gray-600 focus-visible:outline-none focus-visible:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					className,
				)}
				ref={ref}
				value={value}
				onInput={onInput}
				maxLength={maxLength}
				placeholder={placeholder}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
