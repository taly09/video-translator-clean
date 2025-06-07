import React from "react";
import { cn } from "../../utils/cn";

export const Skeleton = ({ className }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
    />
  );
};
