import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type SelectInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  items: { label: string; value: string }[];
  isDisabled?: boolean;
  required?: boolean;
};

const MultiSelectInput = ({
  name,
  label,
  items,
  placeholder = "Select options",
  isDisabled = false,
  required = false,
}: SelectInputProps) => {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Label htmlFor={name} className="text-[16px]">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={isDisabled}
                className="mt-2 mb-0.5 h-10 w-full justify-between hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <div className="flex gap-1 flex-wrap">
                  {field.value.length > 0 ? (
                    items
                      .filter((item) => field.value.includes(item.value))
                      .map((item) => (
                        <span key={item.value}>
                          <Badge variant="outline">{item.label}</Badge>
                        </span>
                      ))
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                </div>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.value}
                        onSelect={() => {
                          const newValue = field.value.includes(item.value)
                            ? field.value.filter(
                                (v: string) => v !== item.value,
                              )
                            : [...field.value, item.value];
                          field.onChange(newValue);
                        }}
                        className="cursor-pointer pr-5 hover:!bg-primary/10 hover:!text-primary data-[selected]:bg-primary/5 data-[selected]:text-primary md:pr-6"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            field.value.includes(item.value)
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
    </div>
  );
};

export default MultiSelectInput;
