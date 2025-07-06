import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const variantStyles = {
  default: {
    bg: "bg-gray-50",
    border: "border border-gray-200",
    text: "text-gray-800",
    icon: <Info className="w-5 h-5 text-gray-500" />,
  },
  success: {
    bg: "bg-green-50",
    border: "border border-green-200",
    text: "text-green-800",
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border border-yellow-200",
    text: "text-yellow-800",
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  },
  destructive: {
    bg: "bg-red-50",
    border: "border border-red-200",
    text: "text-red-800",
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
};

export function Alert({ children, variant = "default", className = "" }) {
  const style = variantStyles[variant];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-md ${style.bg} ${style.border} ${style.text} ${className}`}>
      <div className="mt-0.5">{style.icon}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function AlertDescription({ children, className = "" }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
