import { Controller, useFormContext } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type TextInputProps = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  required?: boolean;
};

const TextInput = ({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
}: TextInputProps) => {
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
            <Input
              type={type}
              id={name}
              placeholder={placeholder}
              className={`w-full py-2 px-3 focus:outline-none mt-2 mb-0.5 focus:border-primary ${
                error ? "border-red-400" : ""
              }`}
              {...field}
              onChange={(e) => {
                field.onChange(
                  type === "number" ? Number(e.target.value) : e.target.value,
                );
              }}
            />
            {error && (
              <span className="text-red-500 text-sm">{error.message}</span>
            )}
          </>
        )}
      />
    </div>
  );
};

export default TextInput;
