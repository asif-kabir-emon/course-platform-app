import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextAreaInputProps = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

const TextAreaInput = ({
  name,
  label,
  placeholder,
  required = false,
}: TextAreaInputProps) => {
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
            <Textarea
              id={name}
              placeholder={placeholder}
              className={`min-h-[110px] w-full py-2 px-3 focus:outline-none mt-2 mb-0.5 focus:border-primary ${
                error ? "border-red-400" : ""
              }`}
              {...field}
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

export default TextAreaInput;
