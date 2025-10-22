import type { ComponentProps } from "preact";
import { forwardRef } from "preact/compat";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, ComponentProps<"div">>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("border border-black bg-white text-black", className)}
			{...props}
		/>
	),
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, ComponentProps<"div">>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("flex flex-col space-y-1.5 p-6", className)}
			{...props}
		/>
	),
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, ComponentProps<"h3">>(
	({ className, ...props }, ref) => (
		<h3
			ref={ref}
			className={cn(
				"text-2xl font-bold leading-none tracking-tight",
				className,
			)}
			{...props}
		/>
	),
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, ComponentProps<"p">>(
	({ className, ...props }, ref) => (
		<p
			ref={ref}
			className={cn("text-sm text-gray-600", className)}
			{...props}
		/>
	),
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, ComponentProps<"div">>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
	),
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, ComponentProps<"div">>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("flex items-center p-6 pt-0", className)}
			{...props}
		/>
	),
);
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
