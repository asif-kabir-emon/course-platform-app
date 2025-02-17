import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen flex justify-center md:items-center pt-12 md:pt-0">
      {children}
    </div>
  );
}
