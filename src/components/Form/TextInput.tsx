import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/Form/PasswordInput";

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
        render={({ field, fieldState: { error } }) => {
          const inputProps = {
            id: name,
            placeholder,
            className: `w-full py-2 px-3 focus:outline-none mt-2 mb-0.5 focus:border-primary ${
              error ? "border-red-400" : ""
            }`,
            ...field,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              field.onChange(
                type === "number"
                  ? Number(event.target.value)
                  : event.target.value,
              );
            },
          };

          return (
            <>
              {type === "password" ? (
                <PasswordInput {...inputProps} />
              ) : (
                <Input type={type} {...inputProps} />
              )}
              {error && (
                <span className="text-red-500 text-sm">{error.message}</span>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default TextInput;
