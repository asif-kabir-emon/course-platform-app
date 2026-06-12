import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/[0.08] via-background to-accent/[0.1] px-4 py-8 sm:px-6 sm:py-12 flex justify-center items-start md:items-center">
      {children}
    </div>
  );
}
