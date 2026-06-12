import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 px-4 py-8 sm:px-6 sm:py-12 flex justify-center items-start md:items-center">
      {children}
    </div>
  );
}
