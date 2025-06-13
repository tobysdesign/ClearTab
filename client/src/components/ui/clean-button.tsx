import React from "react";

interface CleanButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  className?: string;
}

export function CleanButton({ 
  children, 
  onClick, 
  variant = "default", 
  size = "default", 
  disabled = false,
  className = ""
}: CleanButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variantStyles = {
    default: "bg-gray-800 text-white hover:bg-gray-700 border border-gray-600",
    outline: "border border-gray-600 bg-transparent text-white hover:bg-gray-800",
    ghost: "text-white hover:bg-gray-800"
  };
  
  const sizeStyles = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 py-1 text-xs",
    lg: "h-12 px-6 py-3 text-base"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{
        backgroundColor: variant === "default" ? "#1f2937" : variant === "outline" ? "transparent" : "transparent",
        color: "#ffffff",
        borderColor: "#4b5563"
      }}
    >
      {children}
    </button>
  );
}