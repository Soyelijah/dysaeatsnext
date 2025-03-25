"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

// Definición de variantes de botón usando class-variance-authority
const buttonVariants = cva(
  // Base styles
  "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500",
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
        danger: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
        success: "bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500",
        outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
        link: "bg-transparent text-blue-600 hover:underline focus-visible:ring-blue-600 p-0 h-auto font-normal",
      },
      size: {
        xs: "h-8 px-2 text-xs",
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0", // Para botones de solo iconos
      },
      fullWidth: {
        true: "w-full",
      },
      rounded: {
        full: "rounded-full",
        md: "rounded-md",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
      rounded: "md",
    },
  }
);

// Definición de las props del componente
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Componente Button
 * 
 * Un botón flexible y reutilizable con múltiples variantes, tamaños y estados.
 * Soporta íconos, estado de carga, texto de carga y todas las propiedades nativas de botón HTML.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    rounded,
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    ...props
  }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, rounded, className })}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };