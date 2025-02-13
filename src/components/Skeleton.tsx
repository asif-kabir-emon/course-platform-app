import React, { ReactNode } from "react";
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

export const SkeletonArray = ({
  amount,
  children,
}: {
  amount: number;
  children: ReactNode;
}) => {
  return Array.from({ length: amount }).map(() => children);
};

export const SkeletonText = ({
  rows = 1,
  size = "md",
  className,
}: {
  rows?: number;
  size?: "md" | "lg";
  className?: string;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <SkeletonArray amount={rows}>
        <div
          className={cn(
            "bg-secondary animate-pulse w-full rounded-sm",
            rows > 1 && "last:w-3/4",
            size === "md" && "h-3",
            size === "lg" && "h-5",
            className,
          )}
        />
      </SkeletonArray>
    </div>
  );
};
