"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListFilter } from "lucide-react";
import { ReactNode } from "react";

type MobileFilterDialogProps = {
  children: ReactNode;
  activeFilterCount?: number;
  title: string;
  description: string;
};

const MobileFilterDialog = ({
  children,
  activeFilterCount = 0,
  title,
  description,
}: MobileFilterDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-between sm:hidden"
      >
        <span className="flex items-center gap-2">
          <ListFilter className="size-4" />
          Filters
        </span>
        {activeFilterCount > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </Button>
    </DialogTrigger>
    <DialogContent className="bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 gap-5 rounded-t-2xl border-x-0 border-b-0 p-5 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
      <DialogHeader className="pr-8 text-left">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">{children}</div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" className="w-full">
            View results
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default MobileFilterDialog;
