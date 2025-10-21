import type { JSX } from "preact";
import { forwardRef } from "preact/compat";
import { cn } from "@/lib/utils";

export interface SelectProps extends JSX.HTMLAttributes<HTMLSelectElement> {
	value?: string;
	onChange?: (event: Event) => void;
	disabled?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ className, children, disabled, ...props }, ref) => {
		return (
			<select
				className={cn(
					"h-10 w-full appearance-none border border-black bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:border-[#666] disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
					backgroundRepeat: "no-repeat",
					backgroundPosition: "right 0.75rem center",
					backgroundSize: "12px",
				}}
				ref={ref}
				disabled={disabled}
				{...props}
			>
				{children}
			</select>
		);
	},
);
Select.displayName = "Select";

export { Select };
