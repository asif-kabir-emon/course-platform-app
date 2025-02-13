import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { ComponentProps } from "react";

const LoadingSpinner = ({
  className,
  ...props
}: ComponentProps<typeof Loader2Icon>) => {
  return (
    <Loader2Icon
      className={cn("animate-spin text-black", className)}
      {...props}
    />
  );
};

export default LoadingSpinner;
