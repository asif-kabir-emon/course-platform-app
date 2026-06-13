"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export type FilterSelectOption = {
  label: string;
  value: string;
  description?: string;
};

type ResponsiveFilterSelectProps = {
  value: string;
  options: FilterSelectOption[];
  onValueChange: (value: string) => void;
  label: string;
  className?: string;
  mobilePresentation?: "dialog" | "popover";
};

const OptionList = ({
  value,
  options,
  onSelect,
  mobile = false,
}: {
  value: string;
  options: FilterSelectOption[];
  onSelect: (value: string) => void;
  mobile?: boolean;
}) => (
  <div className={cn("space-y-1", mobile ? "pt-2" : "p-1")}>
    {options.map((option) => {
      const selected = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={cn(
            "flex w-full items-center gap-3 text-left transition-colors",
            mobile
              ? "min-h-14 rounded-xl border px-4 py-3"
              : "min-h-10 rounded-md px-3 py-2",
            selected
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-transparent hover:bg-muted",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{option.label}</span>
            {option.description && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {option.description}
              </span>
            )}
          </span>
          <Check
            className={cn(
              "size-4 shrink-0",
              selected ? "opacity-100" : "opacity-0",
            )}
          />
        </button>
      );
    })}
  </div>
);

const ResponsiveFilterSelect = ({
  value,
  options,
  onValueChange,
  label,
  className,
  mobilePresentation = "dialog",
}: ResponsiveFilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  const selectOption = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      aria-expanded={open}
      className={cn(
        "h-11 w-full justify-between rounded-lg bg-background px-3 font-normal shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
        className,
      )}
    >
      <span className="truncate">{selectedOption?.label}</span>
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform",
          open && "rotate-180",
        )}
      />
    </Button>
  );

  if (isMobile && mobilePresentation === "dialog") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 gap-3 rounded-t-2xl border-x-0 border-b-0 p-5 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:max-w-lg">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Choose an option to update the results.
            </DialogDescription>
          </DialogHeader>
          <OptionList
            value={value}
            options={options}
            onSelect={selectOption}
            mobile
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <OptionList
          value={value}
          options={options}
          onSelect={selectOption}
        />
      </PopoverContent>
    </Popover>
  );
};

export default ResponsiveFilterSelect;
