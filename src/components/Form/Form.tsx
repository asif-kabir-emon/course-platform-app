import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";

type FormProps<TFieldValues extends FieldValues> = {
  children: React.ReactNode;
  schema: unknown;
} & UseFormReturn<TFieldValues>;

export const Form = <TFieldValues extends FieldValues>({
  children,
  schema: _schema,
  ...form
}: FormProps<TFieldValues>) => {
  void _schema;
  return <FormProvider {...form}>{children}</FormProvider>;
};
