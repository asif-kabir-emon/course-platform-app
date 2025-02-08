import { FormProvider, UseFormReturn } from "react-hook-form";

type FormProps = {
  children: React.ReactNode;
  schema: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & UseFormReturn<any>;

export const Form = ({ children, ...form }: FormProps) => {
  return <FormProvider {...form}>{children}</FormProvider>;
};
