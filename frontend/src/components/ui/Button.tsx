import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-600/20 hover:shadow-red-700/25",
  ghost:
    "border border-gray-200 hover:border-red-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50",
  danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium
        transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
