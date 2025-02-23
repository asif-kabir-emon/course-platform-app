import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  items: { label: string; value: string }[];
  required?: boolean;
};

const SelectInput = ({
  name,
  label,
  items,
  placeholder = "Select an option",
  required = false,
}: SelectInputProps) => {
  const { control } = useFormContext();

  return (
    <div>
      <Label htmlFor={name} className="text-[16px]">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full mt-2 mb-0.5">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    className="my-1 hover:!bg-slate-200 hover:cursor-pointer hover:!text-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <span className="text-red-500 text-sm">{error.message}</span>
            )}
          </>
        )}
      />
    </div>
  );
};

export default SelectInput;
