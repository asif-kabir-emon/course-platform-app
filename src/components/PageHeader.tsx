import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

const PageHeader = ({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {children && <div>{children}</div>}
    </div>
  );
};

export default PageHeader;
