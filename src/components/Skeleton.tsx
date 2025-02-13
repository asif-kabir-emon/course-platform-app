import React from "react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export const SkeletonButton = ({ className }: { className?: string }) => {
  return (
    <div
      className={buttonVariants({
        variant: "secondary",
        className: cn("pointer-events-none animate-pulse w-24", className),
      })}
    />
  );
};
