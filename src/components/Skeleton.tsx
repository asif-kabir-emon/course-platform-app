import React, { ReactNode } from "react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const SkeletonButton = ({ className }: { className?: string }) => {
  return (
    <div
      className={buttonVariants({
        variant: "secondary",
        className: cn(
          "skeleton-shimmer pointer-events-none w-24 border-0 shadow-none",
          className,
        ),
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
  return Array.from({ length: amount }).map((_, index) => (
    <React.Fragment key={index}>{children}</React.Fragment>
  ));
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
            "skeleton-shimmer w-full rounded-sm",
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

export const TableSkeleton = ({
  columns = 3,
  rows = 5,
  withMedia = false,
}: {
  columns?: number;
  rows?: number;
  withMedia?: boolean;
}) => {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className={cn("h-4 w-20", index === 0 && "w-32")} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <TableCell key={columnIndex}>
                  {withMedia && columnIndex === 0 ? (
                    <div className="flex min-w-56 items-center gap-3">
                      <Skeleton className="size-12 shrink-0" />
                      <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton
                      className={cn(
                        "h-4 w-16",
                        columnIndex === 0 && "w-40",
                        columnIndex === columns - 1 && "h-9 w-24",
                      )}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export const FormPageSkeleton = ({ fields = 5 }: { fields?: number }) => {
  return (
    <div className="page-shell space-y-6" aria-label="Loading form">
      <Skeleton className="h-8 w-48" />
      <div className="max-w-3xl space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>
    </div>
  );
};

export const AuthCardSkeleton = () => {
  return (
    <div
      className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl sm:p-8"
      aria-label="Loading authentication form"
    >
      <div className="mb-7 flex flex-col items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="space-y-5 border-y py-6">
        <Skeleton className="h-4 w-full" />
        {[1, 2].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="mx-auto mt-6 h-4 w-52" />
    </div>
  );
};

export const DetailPageSkeleton = () => {
  return (
    <div className="space-y-6" aria-label="Loading details">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="hidden h-10 w-28 sm:block" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <div className="grid gap-6 border-t p-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t p-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn("h-4 w-24", index % 2 === 1 && "justify-self-end")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
